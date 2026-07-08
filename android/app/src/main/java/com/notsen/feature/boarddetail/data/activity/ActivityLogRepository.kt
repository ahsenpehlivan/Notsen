package com.notsen.feature.boarddetail.data.activity

import com.notsen.core.model.ActivityLog
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class ActivityLogRepository @Inject constructor(
    private val supabaseClient: SupabaseClient
) {
    suspend fun getActivityLogs(boardId: String, limit: Long = 30, beforeCursor: String? = null): Result<List<ActivityLog>> = withContext(Dispatchers.IO) {
        try {
            val logs = supabaseClient.postgrest["activity_logs"]
                .select {
                    filter {
                        eq("board_id", boardId)
                        if (beforeCursor != null) {
                            lt("created_at", beforeCursor)
                        }
                    }
                    order("created_at", Order.DESCENDING)
                    limit(limit)
                }.decodeList<ActivityLog>()

            Result.success(logs)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Yalnızca istemci (client) tarafından yazılması gereken geçici loglar için kullanılır.
    // DND gibi işlemler kendi logunu RPC içinde yazdığından bu metot çağrılmaz.
    suspend fun logActivity(log: ActivityLog): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            supabaseClient.postgrest["activity_logs"].insert(log)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
