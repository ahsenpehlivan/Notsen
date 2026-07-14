package com.notsen.feature.quicknotes

import com.notsen.core.model.Note
import com.notsen.core.model.NoteDateFilter
import com.notsen.core.model.NoteSortOption
import com.notsen.feature.quicknotes.ui.filterAndSortNotes
import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

class NoteFilterReducerTest {

    private val zone = ZoneId.systemDefault()
    private val now = Instant.parse("2026-07-08T15:00:00Z") // Mocked current time
    private val startOfToday = now.atZone(zone).toLocalDate().atStartOfDay(zone).toInstant()

    // 1. Created today (updatedAt empty)
    private val noteToday1 = Note(id = "today1", content = "Today 1", createdAt = now.minus(2, ChronoUnit.HOURS).toString(), updatedAt = "")
    // 2. Created yesterday, updated today
    private val noteToday2 = Note(id = "today2", content = "Today 2", createdAt = now.minus(2, ChronoUnit.DAYS).toString(), updatedAt = now.minus(1, ChronoUnit.HOURS).toString())
    // 3. Created yesterday, updated yesterday
    private val noteYesterday = Note(id = "yesterday", content = "Yesterday", createdAt = startOfToday.minus(10, ChronoUnit.HOURS).toString(), updatedAt = startOfToday.minus(1, ChronoUnit.HOURS).toString())
    // 4. Created 6 days ago (last 7 days)
    private val note6DaysAgo = Note(id = "last7_1", content = "6 days ago", createdAt = now.minus(6, ChronoUnit.DAYS).toString(), updatedAt = now.minus(6, ChronoUnit.DAYS).toString())
    // 5. Created 8 days ago (not in last 7 days)
    private val note8DaysAgo = Note(id = "last30_1", content = "8 days ago", createdAt = now.minus(8, ChronoUnit.DAYS).toString(), updatedAt = "")
    // 6. Created 29 days ago (in last 30 days)
    private val note29DaysAgo = Note(id = "last30_2", content = "29 days ago", createdAt = now.minus(29, ChronoUnit.DAYS).toString(), updatedAt = now.minus(29, ChronoUnit.DAYS).toString())
    // 7. Created 31 days ago (not in last 30 days)
    private val note31DaysAgo = Note(id = "older", content = "31 days ago", createdAt = now.minus(31, ChronoUnit.DAYS).toString(), updatedAt = "")
    // 8. Unparseable date
    private val noteBadDate = Note(id = "bad_date", content = "Bad date", createdAt = "not-a-date", updatedAt = "not-a-date")

    private val sampleNotes = listOf(
        noteToday1, noteToday2, noteYesterday, note6DaysAgo, note8DaysAgo, note29DaysAgo, note31DaysAgo, noteBadDate
    )

    @Test
    fun `today filter returns only notes from today (local time)`() {
        val result = filterAndSortNotes(sampleNotes, "", emptySet(), NoteDateFilter.TODAY, false, false, NoteSortOption.UPDATED_DESC, now)
        assertEquals(2, result.size)
        assertEquals(setOf("today1", "today2"), result.map { it.id }.toSet())
    }

    @Test
    fun `last 7 days filter returns notes up to 7 days ago`() {
        val result = filterAndSortNotes(sampleNotes, "", emptySet(), NoteDateFilter.LAST_7_DAYS, false, false, NoteSortOption.UPDATED_DESC, now)
        // today1, today2, yesterday, last7_1
        assertEquals(4, result.size)
        assertEquals(setOf("today1", "today2", "yesterday", "last7_1"), result.map { it.id }.toSet())
    }

    @Test
    fun `last 30 days filter returns notes up to 30 days ago`() {
        val result = filterAndSortNotes(sampleNotes, "", emptySet(), NoteDateFilter.LAST_30_DAYS, false, false, NoteSortOption.UPDATED_DESC, now)
        // today1, today2, yesterday, last7_1, last30_1, last30_2
        assertEquals(6, result.size)
        assertEquals(setOf("today1", "today2", "yesterday", "last7_1", "last30_1", "last30_2"), result.map { it.id }.toSet())
    }

    @Test
    fun `all filter returns everything including unparseable dates`() {
        val result = filterAndSortNotes(sampleNotes, "", emptySet(), NoteDateFilter.ALL, false, false, NoteSortOption.UPDATED_DESC, now)
        assertEquals(8, result.size)
    }

    @Test
    fun `unparseable dates are hidden in date filters`() {
        val result = filterAndSortNotes(listOf(noteBadDate), "", emptySet(), NoteDateFilter.LAST_30_DAYS, false, false, NoteSortOption.UPDATED_DESC, now)
        assertEquals(0, result.size)
    }

    @Test
    fun `fallback to createdAt if updatedAt is empty`() {
        // noteToday1 has empty updatedAt but createdAt is today
        val result = filterAndSortNotes(listOf(noteToday1), "", emptySet(), NoteDateFilter.TODAY, false, false, NoteSortOption.UPDATED_DESC, now)
        assertEquals(1, result.size)
        assertEquals("today1", result.first().id)
    }

    @Test
    fun `notes with deletedAt are filtered out`() {
        val deletedNote = noteToday1.copy(id = "deleted1", deletedAt = now.toString())
        val result = filterAndSortNotes(listOf(noteToday1, deletedNote), "", emptySet(), NoteDateFilter.ALL, false, false, NoteSortOption.UPDATED_DESC, now)
        
        assertEquals(1, result.size)
        assertEquals("today1", result.first().id)
    }
}
