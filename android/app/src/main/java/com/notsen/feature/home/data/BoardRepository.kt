package com.notsen.feature.home.data

import com.notsen.core.model.Board
import com.notsen.core.model.BoardMember
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID
import javax.inject.Inject

class BoardRepository @Inject constructor(
    private val supabaseClient: SupabaseClient
) {
    suspend fun getBoards(): List<Board> = withContext(Dispatchers.IO) {
        // Fetch all boards. RLS should naturally limit this to owned boards.
        // If shared boards require querying board_members first, we do that here.
        val user = supabaseClient.auth.currentUserOrNull() ?: return@withContext emptyList()
        val userEmail = user.email ?: ""

        val myBoards = supabaseClient.postgrest["boards"]
            .select {
                filter { eq("user_id", user.id) }
            }.decodeList<Board>()

        val memberBoardsRaw = try {
            supabaseClient.postgrest["board_members"]
                .select {
                    filter { eq("user_email", userEmail) }
                }.decodeList<BoardMember>()
        } catch (e: Exception) {
            emptyList<BoardMember>()
        }

        val sharedBoardIds = memberBoardsRaw.map { it.boardId }
        val sharedBoards = try {
            if (sharedBoardIds.isNotEmpty()) {
                supabaseClient.postgrest["boards"]
                    .select {
                        filter { isIn("id", sharedBoardIds) }
                    }.decodeList<Board>()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            emptyList<Board>()
        }

        // Combine and distinct by ID
        (myBoards + sharedBoards).distinctBy { it.id }.sortedBy { it.position }
    }

    suspend fun getColumns(boardId: String): List<com.notsen.core.model.Column> = withContext(Dispatchers.IO) {
        supabaseClient.postgrest["columns"]
            .select {
                filter { eq("board_id", boardId) }
            }.decodeList<com.notsen.core.model.Column>()
            .sortedBy { it.position ?: 0 }
    }

    suspend fun getTasks(boardId: String): List<com.notsen.core.model.Task> = withContext(Dispatchers.IO) {
        supabaseClient.postgrest["tasks"]
            .select {
                filter { eq("board_id", boardId) }
            }.decodeList<com.notsen.core.model.Task>()
            .sortedBy { it.position ?: 0 }
    }

    suspend fun addColumn(boardId: String, title: String, position: Int): com.notsen.core.model.Column = withContext(Dispatchers.IO) {
        val newColumn = com.notsen.core.model.Column(
            id = UUID.randomUUID().toString(),
            boardId = boardId,
            title = title,
            position = position
        )

        supabaseClient.postgrest["columns"].insert(newColumn) {
            select()
        }.decodeSingle<com.notsen.core.model.Column>()
    }

    suspend fun addTask(boardId: String, columnId: String, title: String, description: String, position: Int): com.notsen.core.model.Task = withContext(Dispatchers.IO) {
        val newTask = com.notsen.core.model.Task(
            id = UUID.randomUUID().toString(),
            boardId = boardId,
            columnId = columnId,
            title = title,
            description = description,
            position = position
        )

        supabaseClient.postgrest["tasks"].insert(newTask) {
            select()
        }.decodeSingle<com.notsen.core.model.Task>()
    }

    suspend fun addBoard(title: String): com.notsen.core.model.Board = withContext(Dispatchers.IO) {
        val userId = supabaseClient.auth.currentUserOrNull()?.id ?: ""
        val newBoard = com.notsen.core.model.Board(
            id = UUID.randomUUID().toString(),
            title = title,
            userId = userId
        )

        supabaseClient.postgrest["boards"].insert(newBoard) {
            select()
        }.decodeSingle<com.notsen.core.model.Board>()
    }

    suspend fun updateTask(taskId: String, title: String, description: String): com.notsen.core.model.Task = withContext(Dispatchers.IO) {
        supabaseClient.postgrest["tasks"].update({
            set("title", title)
            set("description", description)
        }) {
            filter { eq("id", taskId) }
            select()
        }.decodeSingle<com.notsen.core.model.Task>()
    }

    suspend fun moveTask(taskId: String, newColumnId: String): com.notsen.core.model.Task = withContext(Dispatchers.IO) {
        supabaseClient.postgrest["tasks"].update({
            set("column_id", newColumnId)
        }) {
            filter { eq("id", taskId) }
            select()
        }.decodeSingle<com.notsen.core.model.Task>()
    }

    suspend fun deleteTask(taskId: String) = withContext(Dispatchers.IO) {
        supabaseClient.postgrest["tasks"].delete {
            filter { eq("id", taskId) }
        }
    }
}
