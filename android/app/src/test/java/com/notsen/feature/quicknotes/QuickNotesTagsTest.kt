package com.notsen.feature.quicknotes

import com.notsen.feature.quicknotes.ui.QuickNotesViewModel
import org.junit.Assert.assertEquals
import org.junit.Test

class QuickNotesTagsTest {

    @Test
    fun `extractTags returns correct tags from content`() {
        val content = "Bugün pazardan #elma #Armut ve #ÇİLEK aldım. #elma"
        val tags = QuickNotesViewModel.extractTags(content)
        
        // Expected: elma, armut, çilek (no duplicates, lowercased, trimmed)
        assertEquals(3, tags.size)
        assertEquals(listOf("elma", "armut", "çilek"), tags)
    }
    
    @Test
    fun `extractTags ignores empty hash symbols`() {
        val content = "Sadece hash # # işareti var. #gercekTag"
        val tags = QuickNotesViewModel.extractTags(content)
        
        assertEquals(1, tags.size)
        assertEquals(listOf("gercektag"), tags)
    }

    @Test
    fun `extractTags handles turkish characters correctly`() {
        val content = "#ığüşöçİĞÜŞÖÇ"
        val tags = QuickNotesViewModel.extractTags(content)
        
        assertEquals(1, tags.size)
        assertEquals("ığüşöçiğüşöç", tags.first())
    }
}
