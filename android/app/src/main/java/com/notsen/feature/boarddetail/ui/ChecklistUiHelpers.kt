package com.notsen.feature.boarddetail.ui

import com.notsen.core.model.ChecklistItem

object ChecklistUiHelpers {
    /**
     * Calculates the checklist progress based on the total number of items and the number of done items.
     * @return A Pair containing the number of done items and the total number of items.
     */
    fun calculateChecklistProgress(checklist: List<ChecklistItem>?): Pair<Int, Int> {
        if (checklist == null) return Pair(0, 0)
        val total = checklist.size
        if (total == 0) return Pair(0, 0)
        val done = checklist.count { it.done }
        return Pair(done, total)
    }

    /**
     * Maps the ChecklistReducer validation errors to user-friendly messages.
     */
    fun getChecklistValidationMessage(errorType: String): String? {
        return when (errorType) {
            "EmptyText" -> "Madde boş olamaz."
            "DuplicateId" -> "Checklist verisi geçersiz."
            "ItemNotFound" -> "Madde bulunamadı."
            "NoChange" -> null // No snackbar for NoChange
            else -> "Bilinmeyen hata."
        }
    }
}
