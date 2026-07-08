package com.notsen.core.datastore

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.notsen.core.model.NoteSortOption
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotesPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val SORT_OPTION_KEY = stringPreferencesKey("notes_sort_option")

    val sortOptionFlow: Flow<NoteSortOption> = context.dataStore.data.map { preferences ->
        val sortName = preferences[SORT_OPTION_KEY] ?: NoteSortOption.UPDATED_DESC.name
        try {
            NoteSortOption.valueOf(sortName)
        } catch (e: Exception) {
            NoteSortOption.UPDATED_DESC
        }
    }

    suspend fun setSortOption(option: NoteSortOption) {
        context.dataStore.edit { preferences ->
            preferences[SORT_OPTION_KEY] = option.name
        }
    }
}
