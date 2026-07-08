package com.notsen.feature.boarddetail.ui

import com.notsen.core.model.Task

object BoardDragDropReducer {

    /**
     * Saf, yan etkisiz (pure) reducer fonksiyonu.
     * Sürüklenen bir görevin, anlık preview (önizleme) pozisyonuna göre listelerin
     * yeni durumunu hesaplar. ViewModel ve Compose bağımlılığı yoktur, bu sayede
     * kolayca Unit Test yazılabilir.
     */
    fun calculatePreviewTasks(
        tasksByColumn: Map<String, List<Task>>,
        draggedTaskId: String,
        targetColumnId: String,
        targetIndex: Int
    ): Map<String, List<Task>> {
        // Mevcut durumu tamamen kopyalamadan, sadece etkilenen sütunlar üzerinde işlem yaparız
        val originalTask = tasksByColumn.values.flatten().find { it.id == draggedTaskId } ?: return tasksByColumn
        val sourceColumnId = originalTask.columnId

        val newTasksByColumn = tasksByColumn.toMutableMap()

        // Kaynak sütun kopyasını al
        val sourceTasks = newTasksByColumn[sourceColumnId]?.toMutableList() ?: mutableListOf()
        val originalIndex = sourceTasks.indexOfFirst { it.id == draggedTaskId }

        if (originalIndex == -1) return tasksByColumn // Beklenmeyen durum

        if (sourceColumnId == targetColumnId) {
            // Aynı Sütunda Taşıma
            val safeTargetIndex = targetIndex.coerceIn(0, (sourceTasks.size - 1).coerceAtLeast(0))
            if (originalIndex == safeTargetIndex) {
                return tasksByColumn // No-op
            }

            // Elemanı çıkar ve yeni yerine ekle
            val task = sourceTasks.removeAt(originalIndex)
            sourceTasks.add(safeTargetIndex, task)

            newTasksByColumn[sourceColumnId] = sourceTasks

        } else {
            // Farklı Sütuna Taşıma
            val targetTasks = newTasksByColumn[targetColumnId]?.toMutableList() ?: mutableListOf()
            val safeTargetIndex = targetIndex.coerceIn(0, targetTasks.size)

            // Kaynaktan çıkar
            val task = sourceTasks.removeAt(originalIndex)
            newTasksByColumn[sourceColumnId] = sourceTasks

            // Hedefe ekle (column_id'sini güncelleyerek)
            val updatedTask = task.copy(columnId = targetColumnId)
            targetTasks.add(safeTargetIndex, updatedTask)
            newTasksByColumn[targetColumnId] = targetTasks
        }

        return newTasksByColumn
    }
}
