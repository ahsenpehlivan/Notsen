const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'android/app/src/main/java/com/notsen/feature/boarddetail/ui/BoardDetailScreen.kt');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of TaskCard
const taskCardStart = content.indexOf('@Composable\nfun TaskCard(task: Task');
if (taskCardStart !== -1) {
    // We will just replace everything from taskCardStart to the end of the file with a cleanly written TaskCard
    
    const cleanTaskCard = `@Composable
fun TaskCard(task: Task, isGhost: Boolean = false, isOverlay: Boolean = false, onClick: () -> Unit) {
    val dragDropState = LocalBoardDragDropState.current
    val viewModel: BoardDetailViewModel = hiltViewModel()
    
    var cardPositionInRoot by remember { mutableStateOf(Offset.Zero) }

    val baseModifier = if (isOverlay) {
        Modifier.fillMaxWidth().border(2.dp, NotsenTheme.colors.accentPrimary, NotsenTheme.shapes.md)
    } else {
        Modifier
            .fillMaxWidth()
            .onGloballyPositioned { coords ->
                cardPositionInRoot = coords.positionInRoot()
            }
            .pointerInput(Unit) {
                detectDragGesturesAfterLongPress(
                    onDragStart = { offset ->
                        if (viewModel.uiState.value.currentUserRole?.canDragAndDrop == true) {
                            dragDropState.onDragStart(
                                taskId = task.id,
                                columnId = task.columnId,
                                initialIndex = task.position ?: 0,
                                initialPointer = cardPositionInRoot + offset
                            )
                            viewModel.onDragStart()
                        }
                    },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        val newPointer = dragDropState.pointerPosition + dragAmount
                        
                        val hVel = when {
                            newPointer.x < 100f -> -15f
                            newPointer.x > 900f -> 15f
                            else -> 0f
                        }
                        
                        var newTargetColId = dragDropState.currentTargetColumnId
                        var newTargetIdx = dragDropState.currentTargetIndex

                        for ((colId, rect) in dragDropState.columnBounds) {
                            if (rect.contains(newPointer)) {
                                newTargetColId = colId
                                break
                            }
                        }

                        if (newTargetColId != null) {
                            val colTasks = viewModel.uiState.value.tasksByColumn[newTargetColId] ?: emptyList()
                            var foundIdx = colTasks.size
                            for ((i, t) in colTasks.withIndex()) {
                                if (t.id == task.id) continue
                                val taskRect = dragDropState.taskBounds[t.id]
                                if (taskRect != null && newPointer.y < taskRect.center.y) {
                                    foundIdx = i
                                    break
                                }
                            }
                            newTargetIdx = foundIdx
                        }
                        
                        dragDropState.onDrag(
                            dragAmount = dragAmount,
                            pointerPos = newPointer,
                            targetColId = newTargetColId,
                            targetIdx = newTargetIdx,
                            hVelocity = hVel,
                            vVelocity = 0f
                        )
                    },
                    onDragEnd = {
                        val draggedId = dragDropState.draggedTaskId
                        val targetColId = dragDropState.currentTargetColumnId
                        val targetIdx = dragDropState.currentTargetIndex
                        val sourceColId = dragDropState.sourceColumnId
                        val sourceIdx = dragDropState.sourceIndex
                        
                        if (draggedId != null && targetColId != null && sourceColId != null) {
                            viewModel.moveTaskRpc(
                                taskId = draggedId, 
                                expectedSourceColumnId = sourceColId,
                                expectedSourcePosition = sourceIdx,
                                targetColumnId = targetColId, 
                                targetIndex = targetIdx
                            )
                        } else {
                            viewModel.cancelDrag()
                        }
                        dragDropState.onDragEnd()
                    },
                    onDragCancel = {
                        viewModel.cancelDrag()
                        dragDropState.onDragCancel()
                    }
                )
            }
    }

    val alphaModifier = if (isGhost) Modifier.graphicsLayer { alpha = 0.01f } else Modifier

    NotsenGlassCard(
        modifier = baseModifier.then(alphaModifier),
        backgroundColor = if (isGhost) NotsenTheme.colors.bgHover else NotsenTheme.colors.bgTertiary,
        borderColor = NotsenTheme.colors.glassBorderSubtle,
        shape = NotsenTheme.shapes.md,
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(NotsenTheme.spacing.lg)
        ) {
            Text(
                text = task.title,
                style = NotsenTheme.typography.labelLarge,
                color = NotsenTheme.colors.textPrimary
            )
            if (task.description.isNotBlank()) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.xs))
                Text(
                    text = task.description,
                    style = NotsenTheme.typography.bodyMedium,
                    color = NotsenTheme.colors.textSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (task.tags?.isNotEmpty() == true || task.dueDate != null) {
                Spacer(modifier = Modifier.height(NotsenTheme.spacing.md))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (task.tags?.isNotEmpty() == true) {
                        Row(horizontalArrangement = Arrangement.spacedBy(NotsenTheme.spacing.xs)) {
                            task.tags.take(3).forEach { tag ->
                                NotsenTagChip(
                                    text = tag,
                                    backgroundColor = NotsenTheme.colors.accentSubtle,
                                    textColor = NotsenTheme.colors.accentPrimary
                                )
                            }
                        }
                    } else {
                        Spacer(modifier = Modifier.width(1.dp))
                    }
                    
                    if (task.dueDate != null) {
                        Text(
                            text = task.dueDate.take(10),
                            style = NotsenTheme.typography.labelSmall,
                            color = NotsenTheme.colors.danger
                        )
                    }
                }
            }
        }
    }
}
`;
    
    const newContent = content.substring(0, taskCardStart) + cleanTaskCard;
    fs.writeFileSync(filePath, newContent);
    console.log("Replaced TaskCard successfully!");
} else {
    console.log("Could not find TaskCard");
}
