package com.notsen.feature.boarddetail.data.realtime

import android.util.Log
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.RealtimeChannel
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import javax.inject.Inject
import com.notsen.core.network.SessionCoordinator

class BoardRealtimeManager @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val sessionCoordinator: SessionCoordinator
) {
    private val mutex = Mutex()
    private var activeChannel: RealtimeChannel? = null
    private var activeActivityChannel: RealtimeChannel? = null
    private var activeMembersChannel: RealtimeChannel? = null
    private var activeBoardId: String? = null
    private var subscriptionJob: Job? = null

    private val _onSubscribed = MutableSharedFlow<Unit>()
    val onSubscribed: SharedFlow<Unit> = _onSubscribed.asSharedFlow()

    private val _boardContentDirty = MutableSharedFlow<Unit>()
    val boardContentDirty: SharedFlow<Unit> = _boardContentDirty.asSharedFlow()

    private val _membersDirty = MutableSharedFlow<Unit>()
    val membersDirty: SharedFlow<Unit> = _membersDirty.asSharedFlow()

    private val _activityLogsDirty = MutableSharedFlow<Unit>()
    val activityLogsDirty: SharedFlow<Unit> = _activityLogsDirty.asSharedFlow()

    suspend fun subscribeToBoard(boardId: String, scope: CoroutineScope) {
        mutex.withLock {
            if (activeBoardId == boardId && activeChannel != null) {
                return // Zaten bu panoya abone
            }

            // Eski channel'ı temizle
            cleanupLocked()

            activeBoardId = boardId
            val channelName = "notsen-realtime-$boardId"

            try {
                val channel = supabaseClient.realtime.channel(channelName)
                activeChannel = channel

                subscriptionJob = scope.launch {
                    launch {
                        sessionCoordinator.sessionExpiredEvent.collect {
                            unsubscribe()
                        }
                    }

                    // Boards
                    channel.postgresChangeFlow<PostgresAction>("public") {
                        table = "boards"
                    }.onEach { action ->
                        if (action is PostgresAction.Update || action is PostgresAction.Delete) {
                            _boardContentDirty.emit(Unit)
                        }
                    }.launchIn(this)

                    // Columns
                    channel.postgresChangeFlow<PostgresAction>("public") {
                        table = "columns"
                    }.onEach {
                        _boardContentDirty.emit(Unit)
                    }.launchIn(this)

                    // Tasks
                    channel.postgresChangeFlow<PostgresAction>("public") {
                        table = "tasks"
                    }.onEach {
                        _boardContentDirty.emit(Unit)
                    }.launchIn(this)

                    // Subscribe to main channel
                    channel.subscribe()
                    Log.d("BoardRealtime", "Subscribed to $channelName")

                    // Subscribed olduktan sonra emit et ki ilk tam refetch atılsın
                    _onSubscribed.emit(Unit)

                    // Members Channel (İzole)
                    val membersChannelName = "notsen-members-$boardId"
                    try {
                        val membersChannel = supabaseClient.realtime.channel(membersChannelName)
                        activeMembersChannel = membersChannel

                        membersChannel.postgresChangeFlow<PostgresAction>("public") {
                            table = "board_members"
                        }.onEach {
                            _membersDirty.emit(Unit)
                        }.launchIn(this)

                        membersChannel.subscribe()
                    } catch (e: Exception) {
                        Log.e("BoardRealtime", "Board members subscribe error: ${e.message}")
                    }

                    // Activity Logs for secondary channel
                    val activityChannelName = "notsen-activity-$boardId"
                    try {
                        val activityChannel = supabaseClient.realtime.channel(activityChannelName)
                        activeActivityChannel = activityChannel

                        activityChannel.postgresChangeFlow<PostgresAction>("public") {
                            table = "activity_logs"
                        }.onEach {
                            _activityLogsDirty.emit(Unit)
                        }.launchIn(this)

                        activityChannel.subscribe()
                    } catch (e: Exception) {
                        Log.e("BoardRealtime", "Activity logs subscribe error: ${e.message}")
                    }
                }
            } catch (e: Exception) {
                Log.e("BoardRealtime", "Subscribe error: ${e.message}")
            }
        }
    }

    suspend fun unsubscribe() {
        mutex.withLock {
            cleanupLocked()
        }
    }

    private suspend fun cleanupLocked() {
        subscriptionJob?.cancel()
        subscriptionJob = null

        activeChannel?.let {
            try {
                it.unsubscribe()
                supabaseClient.realtime.removeChannel(it)
                Log.d("BoardRealtime", "Unsubscribed from channel")
            } catch (e: Exception) {
                Log.e("BoardRealtime", "Unsubscribe error: ${e.message}")
            }
        }

        activeMembersChannel?.let {
            try {
                it.unsubscribe()
                supabaseClient.realtime.removeChannel(it)
            } catch (e: Exception) {
                Log.e("BoardRealtime", "Members unsubscribe error: ${e.message}")
            }
        }

        activeActivityChannel?.let {
            try {
                it.unsubscribe()
                supabaseClient.realtime.removeChannel(it)
            } catch (e: Exception) {
                Log.e("BoardRealtime", "Activity logs unsubscribe error: ${e.message}")
            }
        }

        activeChannel = null
        activeMembersChannel = null
        activeActivityChannel = null
        activeBoardId = null
    }
}
