package com.notsen.feature.boarddetail.data

import android.util.Log
import com.notsen.core.model.Board
import com.notsen.core.model.BoardMember
import com.notsen.core.model.PermissionRole
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.rpc
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

import com.notsen.core.network.SessionCoordinator
import javax.inject.Inject

@Serializable
private data class InviteUserParams(
    val p_board_id: String,
    val p_email: String,
    val p_role: String
)

@Serializable
private data class UpdateRoleParams(
    val p_member_id: String,
    val p_role: String
)

@Serializable
private data class RemoveMemberParams(
    val p_member_id: String
)

class BoardMemberRepository @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val sessionCoordinator: SessionCoordinator
) {
    suspend fun getMembers(boardId: String): Result<List<BoardMember>> = withContext(Dispatchers.IO) {
        try {
            val members = sessionCoordinator.safeRequest {
                supabaseClient.postgrest["board_members"]
                    .select {
                        filter {
                            eq("board_id", boardId)
                        }
                    }.decodeList<BoardMember>()
            }
            Result.success(members)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun inviteMember(boardId: String, email: String, role: PermissionRole): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val roleStr = when(role) {
                PermissionRole.EDITOR -> "editor"
                PermissionRole.VIEWER -> "viewer"
                else -> throw IllegalArgumentException("Owner rolü atanamaz")
            }

            sessionCoordinator.safeRequest {
                supabaseClient.postgrest.rpc(
                    function = "invite_user_to_board",
                    parameters = InviteUserParams(
                        p_board_id = boardId,
                        p_email = email,
                        p_role = roleStr
                    )
                )
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateMemberRole(memberId: String, role: PermissionRole, currentUserRole: PermissionRole? = null): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val roleStr = when(role) {
                PermissionRole.EDITOR -> "editor"
                PermissionRole.VIEWER -> "viewer"
                else -> throw IllegalArgumentException("Owner rolü atanamaz")
            }

            Log.d("BoardMemberRepository", "MEMBER_ROLE_UPDATE_CLICKED memberId=$memberId targetRole=$roleStr")
            Log.d("BoardMemberRepository", "MEMBER_ROLE_UPDATE_CURRENT_USER_ROLE=${currentUserRole?.name}")
            Log.d("BoardMemberRepository", "MEMBER_ROLE_UPDATE_RPC_START")

            sessionCoordinator.safeRequest {
                supabaseClient.postgrest.rpc(
                    function = "update_board_member_role",
                    parameters = UpdateRoleParams(
                        p_member_id = memberId,
                        p_role = roleStr
                    )
                )
            }
            
            Log.d("BoardMemberRepository", "MEMBER_ROLE_UPDATE_RPC_SUCCESS")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.d("BoardMemberRepository", "MEMBER_ROLE_UPDATE_RPC_FAILURE errorType=${e.javaClass.simpleName} message=${e.message}")
            Result.failure(e)
        }
    }

    suspend fun removeMember(memberId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            sessionCoordinator.safeRequest {
                supabaseClient.postgrest.rpc(
                    function = "remove_board_member",
                    parameters = RemoveMemberParams(
                        p_member_id = memberId
                    )
                )
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resolveUserRole(
        board: Board?,
        members: List<BoardMember>
    ): PermissionRole {
        val user = supabaseClient.auth.currentUserOrNull()
        val userId = user?.id
        val userEmail = user?.email

        if (board?.userId != null && board.userId == userId) return PermissionRole.OWNER

        val myMember = members.find { it.userEmail == userEmail }
        if (myMember != null) {
            return myMember.role
        }

        // Eğer kullanıcı panonun sahibi değilse ve üye listesinde yoksa varsayılan olarak izleyici (viewer) kabul et.
        return PermissionRole.VIEWER
    }
}
