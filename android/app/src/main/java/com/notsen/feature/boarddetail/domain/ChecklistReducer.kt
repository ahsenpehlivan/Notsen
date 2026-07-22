package com.notsen.feature.boarddetail.domain

import com.notsen.core.model.ChecklistItem
import java.util.UUID

sealed interface ChecklistMutation {
    data class Add(val text: String) : ChecklistMutation
    data class Toggle(val itemId: String) : ChecklistMutation
    data class Rename(val itemId: String, val newText: String) : ChecklistMutation
    data class Delete(val itemId: String) : ChecklistMutation
}

enum class ChecklistValidationError {
    EmptyText,
    ItemNotFound,
    DuplicateId,
    NoChange
}

sealed interface ChecklistMutationResult {
    data class Success(val items: List<ChecklistItem>) : ChecklistMutationResult
    data class Rejected(val reason: ChecklistValidationError) : ChecklistMutationResult
}

object ChecklistReducer {
    fun reduce(currentItems: List<ChecklistItem>, mutation: ChecklistMutation): ChecklistMutationResult {
        // Find if input list has duplicate IDs (invalid input state)
        if (currentItems.distinctBy { it.id }.size != currentItems.size) {
            return ChecklistMutationResult.Rejected(ChecklistValidationError.DuplicateId)
        }

        return when (mutation) {
            is ChecklistMutation.Add -> {
                val trimmedText = mutation.text.trim()
                if (trimmedText.isEmpty()) {
                    return ChecklistMutationResult.Rejected(ChecklistValidationError.EmptyText)
                }
                
                val newItem = ChecklistItem(
                    id = UUID.randomUUID().toString(),
                    text = trimmedText,
                    done = false
                )
                
                ChecklistMutationResult.Success(currentItems + newItem)
            }
            
            is ChecklistMutation.Toggle -> {
                val index = currentItems.indexOfFirst { it.id == mutation.itemId }
                if (index == -1) {
                    return ChecklistMutationResult.Rejected(ChecklistValidationError.ItemNotFound)
                }
                
                val updatedItems = currentItems.toMutableList()
                val oldItem = updatedItems[index]
                updatedItems[index] = oldItem.copy(done = !oldItem.done)
                
                ChecklistMutationResult.Success(updatedItems)
            }
            
            is ChecklistMutation.Rename -> {
                val trimmedText = mutation.newText.trim()
                if (trimmedText.isEmpty()) {
                    return ChecklistMutationResult.Rejected(ChecklistValidationError.EmptyText)
                }
                
                val index = currentItems.indexOfFirst { it.id == mutation.itemId }
                if (index == -1) {
                    return ChecklistMutationResult.Rejected(ChecklistValidationError.ItemNotFound)
                }
                
                val oldItem = currentItems[index]
                if (oldItem.text == trimmedText) {
                    return ChecklistMutationResult.Rejected(ChecklistValidationError.NoChange)
                }
                
                val updatedItems = currentItems.toMutableList()
                updatedItems[index] = oldItem.copy(text = trimmedText)
                
                ChecklistMutationResult.Success(updatedItems)
            }
            
            is ChecklistMutation.Delete -> {
                val index = currentItems.indexOfFirst { it.id == mutation.itemId }
                if (index == -1) {
                    return ChecklistMutationResult.Rejected(ChecklistValidationError.ItemNotFound)
                }
                
                val updatedItems = currentItems.toMutableList()
                updatedItems.removeAt(index)
                
                ChecklistMutationResult.Success(updatedItems)
            }
        }
    }
}
