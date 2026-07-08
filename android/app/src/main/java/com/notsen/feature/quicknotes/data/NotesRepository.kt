package com.notsen.feature.quicknotes.data

import com.notsen.core.model.Note
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.channels.BufferOverflow
import javax.inject.Inject

class NotesRepository @Inject constructor(
    private val supabaseClient: SupabaseClient
) {
    private val _refreshTrigger = MutableSharedFlow<Unit>(replay = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
    val refreshTrigger = _refreshTrigger.asSharedFlow()

    init {
        _refreshTrigger.tryEmit(Unit)
    }
    private val table = supabaseClient.postgrest["notes"]

    suspend fun getNotes(limit: Long = 50, offset: Long = 0): List<Note> = withContext(Dispatchers.IO) {
        table.select {
            order("created_at", order = Order.DESCENDING)
            range(offset, offset + limit - 1)
        }.decodeList<Note>()
    }

    suspend fun addNote(content: String, tags: List<String>): Note = withContext(Dispatchers.IO) {
        val user = supabaseClient.auth.currentUserOrNull()
        val userId = user?.id ?: ""
        val newNote = Note(
            id = UUID.randomUUID().toString(),
            userId = userId,
            content = content,
            tags = tags
        )
        // Insert the note and return the inserted instance (with DB generated fields like created_at)
        val insertedNote = supabaseClient.postgrest["notes"].insert(newNote) {
            select()
        }.decodeSingle<Note>()

        _refreshTrigger.tryEmit(Unit)

        insertedNote
    }

    suspend fun updateNote(id: String, content: String, tags: List<String>): Note = withContext(Dispatchers.IO) {
        // We only update the relevant fields.
        table.update(
            {
                set("content", content)
                set("tags", tags)
            }
        ) {
            filter { eq("id", id) }
            select()
        }.decodeSingle<Note>()
    }

    suspend fun deleteNote(id: String) = withContext(Dispatchers.IO) {
        table.delete {
            filter { eq("id", id) }
        }
    }
}
