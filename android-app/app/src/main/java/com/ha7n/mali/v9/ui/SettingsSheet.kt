package com.ha7n.mali.v9.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Backup
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.DarkMode
import androidx.compose.material.icons.rounded.FileDownload
import androidx.compose.material.icons.rounded.FileUpload
import androidx.compose.material.icons.rounded.LightMode
import androidx.compose.material.icons.rounded.PhoneAndroid
import androidx.compose.material.icons.rounded.SettingsBrightness
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ha7n.mali.v9.data.AppSettings
import com.ha7n.mali.v9.data.ThemeMode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate

private const val MAX_BACKUP_BYTES = 4_000_000

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SettingsSheet(
    settings: AppSettings,
    viewModel: MaliViewModel,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var pendingBackup by remember { mutableStateOf<String?>(null) }
    var pendingImport by remember { mutableStateOf<String?>(null) }

    val exportLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json"),
    ) { uri: Uri? ->
        val raw = pendingBackup
        pendingBackup = null
        if (uri == null || raw == null) return@rememberLauncherForActivityResult
        scope.launch {
            val result = runCatching {
                withContext(Dispatchers.IO) {
                    context.contentResolver.openOutputStream(uri, "wt")?.use { stream ->
                        stream.write(raw.toByteArray(Charsets.UTF_8))
                        stream.flush()
                    } ?: error("تعذر فتح ملف الحفظ")
                }
            }
            viewModel.reportMessage(
                if (result.isSuccess) "تم تصدير النسخة الاحتياطية" else "تعذر حفظ النسخة الاحتياطية",
            )
        }
    }

    val importLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            runCatching {
                withContext(Dispatchers.IO) { readTextLimited(context.contentResolver.openInputStream(uri)) }
            }.onSuccess { pendingImport = it }
                .onFailure { viewModel.reportMessage("ملف النسخة الاحتياطية غير صالح أو كبير جدًا") }
        }
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(start = 18.dp, end = 18.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("الإعدادات", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                Text(
                    "المظهر والنسخة الاحتياطية فقط؛ الأشياء اليومية تبقى خارج هذه الشاشة.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            SettingsCard(
                title = "المظهر",
                subtitle = "يتغير التطبيق وشريط النظام مع اختيارك",
                icon = Icons.Rounded.SettingsBrightness,
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ThemeChip(
                        label = "النظام",
                        selected = settings.themeMode == ThemeMode.SYSTEM,
                        icon = Icons.Rounded.PhoneAndroid,
                    ) { viewModel.setThemeMode(ThemeMode.SYSTEM) }
                    ThemeChip(
                        label = "فاتح",
                        selected = settings.themeMode == ThemeMode.LIGHT,
                        icon = Icons.Rounded.LightMode,
                    ) { viewModel.setThemeMode(ThemeMode.LIGHT) }
                    ThemeChip(
                        label = "داكن",
                        selected = settings.themeMode == ThemeMode.DARK,
                        icon = Icons.Rounded.DarkMode,
                    ) { viewModel.setThemeMode(ThemeMode.DARK) }
                }
            }

            SettingsCard(
                title = "النسخ الاحتياطي",
                subtitle = "احفظ بياناتك في ملف JSON أو استعد نسخة سابقة",
                icon = Icons.Rounded.Backup,
            ) {
                Button(
                    onClick = {
                        viewModel.createBackup { raw ->
                            pendingBackup = raw
                            exportLauncher.launch("mali-backup-${LocalDate.now()}.json")
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Icon(Icons.Rounded.FileUpload, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("تصدير نسخة احتياطية", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = { importLauncher.launch(arrayOf("application/json", "text/plain")) },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Icon(Icons.Rounded.FileDownload, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("استيراد نسخة احتياطية", fontWeight = FontWeight.Bold)
                }
            }

            Card(shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("مالي v9", fontWeight = FontWeight.Black)
                    Text(
                        "محلي أولًا • بدون اعتماد على الإنترنت • المبالغ بالريال الكامل",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }

    pendingImport?.let { raw ->
        AlertDialog(
            onDismissRequest = { pendingImport = null },
            title = { Text("استبدال البيانات الحالية؟", fontWeight = FontWeight.Black) },
            text = {
                Text("سيتم التحقق من الملف أولًا ثم استبدال بيانات مالي الحالية بالنسخة المستوردة. احتفظ بنسخة تصدير حديثة قبل المتابعة.")
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.restoreBackup(raw) { pendingImport = null; onDismiss() }
                }) {
                    Text("استيراد")
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingImport = null }) { Text("إلغاء") }
            },
        )
    }
}

@Composable
private fun SettingsCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    content: @Composable Column.() -> Unit,
) {
    Card(shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Column {
                    Text(title, fontWeight = FontWeight.Black)
                    Text(
                        subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            content()
        }
    }
}

@Composable
private fun ThemeChip(
    label: String,
    selected: Boolean,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        leadingIcon = {
            Icon(
                if (selected) Icons.Rounded.Check else icon,
                contentDescription = null,
                modifier = Modifier.size(FilterChipDefaults.IconSize),
            )
        },
    )
}

private fun readTextLimited(input: java.io.InputStream?): String {
    requireNotNull(input) { "تعذر فتح الملف" }
    input.use { stream ->
        val output = java.io.ByteArrayOutputStream()
        val buffer = ByteArray(8_192)
        var total = 0
        while (true) {
            val count = stream.read(buffer)
            if (count < 0) break
            total += count
            require(total <= MAX_BACKUP_BYTES) { "الملف كبير جدًا" }
            output.write(buffer, 0, count)
        }
        return output.toString(Charsets.UTF_8.name())
    }
}
