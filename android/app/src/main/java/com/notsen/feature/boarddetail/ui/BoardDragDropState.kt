package com.notsen.feature.boarddetail.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect

/**
 * Yüksek frekanslı sürükle-bırak (Drag & Drop) hesaplamaları için
 * Compose UI'da yaşayan State Holder nesnesi.
 * ViewModel'in recomposition yığmasını önler.
 */
class BoardDragDropState {

    // Aktif drag durumu
    var isDragging by mutableStateOf(false)
        private set

    var draggedTaskId by mutableStateOf<String?>(null)
        private set

    // Source verileri (Rollback ve No-Op kontrolü için)
    var sourceColumnId by mutableStateOf<String?>(null)
        private set
    var sourceIndex by mutableIntStateOf(-1)
        private set

    // Geçerli hedefler
    var currentTargetColumnId by mutableStateOf<String?>(null)
        private set
    var currentTargetIndex by mutableIntStateOf(-1)
        private set

    // Pointer ve UI konumları
    var pointerPosition by mutableStateOf(Offset.Zero)
        private set
    var dragOffset by mutableStateOf(Offset.Zero)
        private set

    // Auto-scroll hızları (Kenara yaklaştıkça artar)
    var horizontalScrollVelocity by mutableFloatStateOf(0f)
        private set
    var verticalScrollVelocity by mutableFloatStateOf(0f)
        private set

    // Tüm sütunların ve taskların ekrandaki anlık konumları
    val columnBounds = mutableMapOf<String, Rect>()
    val taskBounds = mutableMapOf<String, Rect>()

    fun onDragStart(taskId: String, columnId: String, initialIndex: Int, initialPointer: Offset) {
        draggedTaskId = taskId
        sourceColumnId = columnId
        sourceIndex = initialIndex

        currentTargetColumnId = columnId
        currentTargetIndex = initialIndex

        pointerPosition = initialPointer
        dragOffset = Offset.Zero
        isDragging = true

        horizontalScrollVelocity = 0f
        verticalScrollVelocity = 0f
    }

    fun onDrag(
        dragAmount: Offset,
        pointerPos: Offset,
        targetColId: String?,
        targetIdx: Int,
        hVelocity: Float,
        vVelocity: Float
    ) {
        dragOffset += dragAmount
        pointerPosition = pointerPos

        targetColId?.let { currentTargetColumnId = it }
        if (targetIdx >= 0) {
            currentTargetIndex = targetIdx
        }

        horizontalScrollVelocity = hVelocity
        verticalScrollVelocity = vVelocity
    }

    fun onDragEnd() {
        resetState()
    }

    fun onDragCancel() {
        resetState()
    }

    private fun resetState() {
        isDragging = false
        draggedTaskId = null
        sourceColumnId = null
        sourceIndex = -1
        currentTargetColumnId = null
        currentTargetIndex = -1
        pointerPosition = Offset.Zero
        dragOffset = Offset.Zero
        horizontalScrollVelocity = 0f
        verticalScrollVelocity = 0f
    }
}

@Composable
fun rememberBoardDragDropState(): BoardDragDropState {
    return remember { BoardDragDropState() }
}
