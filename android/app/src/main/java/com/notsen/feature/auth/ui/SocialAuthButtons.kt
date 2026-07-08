package com.notsen.feature.auth.ui

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.notsen.R

enum class AuthMode {
    LOGIN, REGISTER
}

enum class OAuthProvider {
    GOOGLE, GITHUB
}

@Composable
fun SocialAuthButtons(
    mode: AuthMode,
    isLoading: Boolean,
    loadingProvider: OAuthProvider?,
    onGoogleClick: () -> Unit,
    onGitHubClick: () -> Unit
) {
    val googleText = if (mode == AuthMode.LOGIN) "Google ile devam et" else "Google ile kayıt ol"
    val githubText = if (mode == AuthMode.LOGIN) "GitHub ile devam et" else "GitHub ile kayıt ol"

    OutlinedButton(
        onClick = onGoogleClick,
        modifier = Modifier.fillMaxWidth(),
        enabled = !isLoading
    ) {
        if (isLoading && loadingProvider == OAuthProvider.GOOGLE) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = MaterialTheme.colorScheme.primary,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(8.dp))
        } else {
            Icon(
                painter = painterResource(id = R.drawable.ic_google),
                contentDescription = "Google",
                modifier = Modifier.size(20.dp),
                tint = Color.Unspecified
            )
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(googleText)
    }

    Spacer(modifier = Modifier.height(12.dp))

    OutlinedButton(
        onClick = onGitHubClick,
        modifier = Modifier.fillMaxWidth(),
        enabled = !isLoading
    ) {
        if (isLoading && loadingProvider == OAuthProvider.GITHUB) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = MaterialTheme.colorScheme.primary,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(8.dp))
        } else {
            Icon(
                painter = painterResource(id = R.drawable.ic_github),
                contentDescription = "GitHub",
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.width(8.dp))
        }
        Text(githubText)
    }
}
