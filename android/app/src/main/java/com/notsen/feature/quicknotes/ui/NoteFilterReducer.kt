package com.notsen.feature.quicknotes.ui

import com.notsen.core.model.Note
import com.notsen.core.model.NoteDateFilter
import com.notsen.core.model.NoteSortOption
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

fun parseSupabaseDate(dateStr: String?): Instant? {
    if (dateStr.isNullOrBlank()) return null
    var cleanStr = dateStr.trim()
    // 2026-07-08 10:32:15 -> 2026-07-08T10:32:15
    if (cleanStr.contains(" ") && !cleanStr.contains("T")) {
        cleanStr = cleanStr.replaceFirst(" ", "T")
    }
    // 2026-07-08 10:32:15.123456+00 -> 2026-07-08T10:32:15.123456+00:00
    if (cleanStr.endsWith("+00")) {
        cleanStr += ":00"
    }

    try {
        return java.time.OffsetDateTime.parse(cleanStr).toInstant()
    } catch (e: Exception) {}

    try {
        return Instant.parse(cleanStr)
    } catch (e: Exception) {}

    // Lacks offset? Assume UTC -> append Z
    if (!cleanStr.endsWith("Z") && !cleanStr.contains("+") && !cleanStr.contains(Regex("-[0-9]{2}:[0-9]{2}"))) {
        try {
            return Instant.parse(cleanStr + "Z")
        } catch (e: Exception) {}
        
        try {
            return java.time.LocalDateTime.parse(cleanStr).atZone(ZoneId.of("UTC")).toInstant()
        } catch (e: Exception) {}
    }

    return null
}

fun noteInstant(note: Note): Instant? {
    val updated = parseSupabaseDate(note.updatedAt)
    if (updated != null) return updated
    return parseSupabaseDate(note.createdAt)
}

fun filterAndSortNotes(
    notes: List<Note>,
    query: String,
    selectedTags: Set<String>,
    dateFilter: NoteDateFilter,
    showPinnedOnly: Boolean,
    showArchived: Boolean,
    sortOption: NoteSortOption,
    now: Instant = Instant.now()
): List<Note> {
    val q = query.trim().lowercase()

    var logCount = 0

    return notes.filter { note ->
        // 1. Archive filter
        if (showArchived) {
            if (!note.isArchived) return@filter false
        } else {
            if (note.isArchived) return@filter false
        }

        // 2. Pinned filter
        if (showPinnedOnly && !note.isPinned) return@filter false

        // 3. Date filter
        if (dateFilter != NoteDateFilter.ALL) {
            val instant = noteInstant(note)
            
            val passDate = if (instant == null) {
                false
            } else {
                when (dateFilter) {
                    NoteDateFilter.TODAY -> {
                        val zone = ZoneId.systemDefault()
                        val startOfToday = now.atZone(zone).toLocalDate().atStartOfDay(zone).toInstant()
                        instant.isAfter(startOfToday) || instant == startOfToday
                    }
                    NoteDateFilter.LAST_7_DAYS -> {
                        val sevenDaysAgo = now.minus(7, ChronoUnit.DAYS)
                        instant.isAfter(sevenDaysAgo) || instant == sevenDaysAgo
                    }
                    NoteDateFilter.LAST_30_DAYS -> {
                        val thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS)
                        instant.isAfter(thirtyDaysAgo) || instant == thirtyDaysAgo
                    }
                    else -> true
                }
            }
            
            if (logCount < 5) {
                println("NOTE_DATE_SAMPLE id=${note.id.take(8)} createdAtRaw=${note.createdAt} updatedAtRaw=${note.updatedAt} parsed=${instant != null} included=$passDate")
                logCount++
            }
            
            if (!passDate) return@filter false
        } else {
            if (logCount < 5) {
                val instant = noteInstant(note)
                println("NOTE_DATE_SAMPLE id=${note.id.take(8)} createdAtRaw=${note.createdAt} updatedAtRaw=${note.updatedAt} parsed=${instant != null} included=true (ALL)")
                logCount++
            }
        }

        // 4. Tag filter
        if (selectedTags.isNotEmpty()) {
            val hasTag = selectedTags.any { tag -> note.tags.contains(tag) }
            if (!hasTag) return@filter false
        }

        // 5. Query filter (title, content, tags)
        if (q.isNotEmpty()) {
            val titleMatch = note.title.lowercase().contains(q)
            val contentMatch = note.content.lowercase().contains(q)
            val tagMatch = note.tags.any { it.lowercase().contains(q) }
            if (!(titleMatch || contentMatch || tagMatch)) return@filter false
        }

        true
    }.sortedWith { n1, n2 ->
        if (sortOption == NoteSortOption.PINNED_FIRST) {
            if (n1.isPinned && !n2.isPinned) return@sortedWith -1
            if (!n1.isPinned && n2.isPinned) return@sortedWith 1
            // fallback to updated desc
            val t1 = noteInstant(n1) ?: Instant.EPOCH
            val t2 = noteInstant(n2) ?: Instant.EPOCH
            return@sortedWith t2.compareTo(t1)
        }

        val t1 = noteInstant(n1) ?: Instant.EPOCH
        val t2 = noteInstant(n2) ?: Instant.EPOCH
        val c1 = parseSupabaseDate(n1.createdAt) ?: Instant.EPOCH
        val c2 = parseSupabaseDate(n2.createdAt) ?: Instant.EPOCH

        when (sortOption) {
            NoteSortOption.UPDATED_DESC -> t2.compareTo(t1)
            NoteSortOption.CREATED_DESC -> c2.compareTo(c1)
            NoteSortOption.CREATED_ASC -> c1.compareTo(c2)
            NoteSortOption.TITLE_ASC -> n1.title.compareTo(n2.title)
            NoteSortOption.PINNED_FIRST -> 0 // Handled above
        }
    }
}
