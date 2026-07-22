package com.notsen.feature.boarddetail.domain

import com.notsen.core.model.ChecklistItem
import com.notsen.core.model.Task
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ChecklistSerializationTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun `Empty array is deserialized to empty list`() {
        val jsonString = """{"id":"1", "board_id":"b1", "column_id":"c1", "title":"T", "description":"D", "checklist":[]}"""
        val task = json.decodeFromString<Task>(jsonString)
        
        assertNotNull(task.checklist)
        assertTrue(task.checklist!!.isEmpty())
    }

    @Test
    fun `Null checklist is safely mapped to null`() {
        val jsonString = """{"id":"1", "board_id":"b1", "column_id":"c1", "title":"T", "description":"D", "checklist":null}"""
        val task = json.decodeFromString<Task>(jsonString)
        
        assertEquals(null, task.checklist)
    }

    @Test
    fun `Missing checklist is safely mapped to emptyList by default value`() {
        val jsonString = """{"id":"1", "board_id":"b1", "column_id":"c1", "title":"T", "description":"D"}"""
        val task = json.decodeFromString<Task>(jsonString)
        
        assertNotNull(task.checklist)
        assertTrue(task.checklist!!.isEmpty())
    }

    @Test
    fun `Canonical item round-trip works`() {
        val originalItem = ChecklistItem(id = "item1", text = "Görevi yap", done = true)
        val jsonString = json.encodeToString(ChecklistItem.serializer(), originalItem)
        val deserialized = json.decodeFromString(ChecklistItem.serializer(), jsonString)
        
        assertEquals(originalItem.id, deserialized.id)
        assertEquals(originalItem.text, deserialized.text)
        assertEquals(originalItem.done, deserialized.done)
    }

    @Test
    fun `Turkish characters are preserved`() {
        val jsonString = """{"id":"1", "text":"Çalışıp öğreneceğiz", "done":false}"""
        val item = json.decodeFromString<ChecklistItem>(jsonString)
        
        assertEquals("Çalışıp öğreneceğiz", item.text)
    }

    @Test
    fun `done=true is preserved`() {
        val jsonString = """{"id":"1", "text":"A", "done":true}"""
        val item = json.decodeFromString<ChecklistItem>(jsonString)
        
        assertEquals(true, item.done)
    }

    @Test
    fun `Unknown JSON fields do not cause crash`() {
        val jsonString = """{"id":"1", "text":"A", "done":false, "created_at":"2023-01-01T00:00:00Z", "author":"admin"}"""
        val item = json.decodeFromString<ChecklistItem>(jsonString)
        
        assertEquals("1", item.id)
        assertEquals("A", item.text)
        assertEquals(false, item.done)
    }
}
