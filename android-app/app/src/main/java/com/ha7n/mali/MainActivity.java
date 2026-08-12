package com.ha7n.mali;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final String APP_URL = "file:///android_asset/index.html";
    private static final int WEB_CACHE_VERSION = 13;
    private static final String FINANCE_PREFS = "mali_finance_local";
    private static final String FINANCE_DATA_KEY = "finance_state_v1";
    private static final int MAX_BACKUP_BYTES = 2_000_000;
    public static final String CHANNEL_ID = "mali_financial_reminders";
    private static final int NOTIFICATION_REQUEST = 210;
    private static final int EXPORT_REQUEST = 310;
    private static final int IMPORT_REQUEST = 311;

    private WebView webView;
    private ProgressBar progressBar;
    private String pendingExport;

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        ReminderScheduler.scheduleNext(this);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(244, 247, 245));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(244, 247, 245));
        root.addView(webView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        root.addView(progressBar, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, dp(3)));
        setContentView(root);
        applySystemTheme(false);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(false);
        webSettings.setAllowFileAccessFromFileURLs(false);
        webSettings.setAllowUniversalAccessFromFileURLs(false);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webSettings.setUserAgentString(webSettings.getUserAgentString() + " MaliAndroid/8.2.1 Offline");
        clearWebCacheAfterUpgrade();
        webView.addJavascriptInterface(new MaliBridge(), "MaliAndroid");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int progress) {
                progressBar.setProgress(progress);
                progressBar.setVisibility(progress >= 100 ? View.GONE : View.VISIBLE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("file".equals(uri.getScheme())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                    Toast.makeText(MainActivity.this, "تعذر فتح الرابط الخارجي", Toast.LENGTH_SHORT).show();
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                installThemeSync();
                evaluateAssetScript("enhancements.js");
                evaluateAssetScript("ux-v82.js");
                evaluateAssetScript("whole-riyal-editing.js");
                sendNotificationStatusToWeb();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(MainActivity.this, "تعذر فتح واجهة مالي المحلية", Toast.LENGTH_LONG).show();
                }
            }
        });

        if (savedInstanceState == null) webView.loadUrl(APP_URL);
        else webView.restoreState(savedInstanceState);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, getString(R.string.notification_channel_name), NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription(getString(R.string.notification_channel_description));
            channel.enableVibration(true);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    private void installThemeSync() {
        if (webView == null) return;
        String script = "(function(){try{" +
                "if(!document.getElementById('mali-native-theme-fix')){" +
                "const s=document.createElement('style');s.id='mali-native-theme-fix';" +
                "s.textContent='.dark .top{background:rgba(7,19,15,.97)!important}.dark .nav{background:rgba(7,19,15,.98)!important}.dark .nav button.active{background:#10271f!important}.dark{color-scheme:dark}';" +
                "document.head.appendChild(s);}" +
                "const sync=()=>{const dark=document.body.classList.contains('dark');" +
                "const meta=document.querySelector('meta[name=theme-color]');if(meta)meta.setAttribute('content',dark?'#07130f':'#f4f7f5');" +
                "if(window.MaliAndroid&&window.MaliAndroid.setSystemDarkMode)window.MaliAndroid.setSystemDarkMode(dark);};" +
                "if(!window.__maliThemeObserver){window.__maliThemeObserver=new MutationObserver(sync);window.__maliThemeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});}" +
                "sync();}catch(e){}})();";
        webView.evaluateJavascript(script, null);
    }

    private void evaluateAssetScript(String assetName) {
        if (webView == null) return;
        try (InputStream input = getAssets().open(assetName);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            String script = output.toString(StandardCharsets.UTF_8.name());
            webView.evaluateJavascript(script, null);
        } catch (Exception error) {
            Toast.makeText(this, "تعذر تحميل تحسينات مالي المحلية", Toast.LENGTH_LONG).show();
        }
    }

    private void applySystemTheme(boolean dark) {
        int surface = dark ? Color.rgb(7, 19, 15) : Color.rgb(244, 247, 245);
        getWindow().setStatusBarColor(surface);
        getWindow().setNavigationBarColor(surface);
        if (webView != null) webView.setBackgroundColor(surface);

        View decor = getWindow().getDecorView();
        int flags = decor.getSystemUiVisibility();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            else flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            else flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        decor.setSystemUiVisibility(flags);
    }

    private boolean notificationsEnabled() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null || !manager.areNotificationsEnabled()) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = manager.getNotificationChannel(CHANNEL_ID);
            return channel != null && channel.getImportance() != NotificationManager.IMPORTANCE_NONE;
        }
        return true;
    }

    private void openNotificationSettings() {
        Intent settingsIntent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
        startActivity(settingsIntent);
    }

    private void scheduleReminder(String frequency, int hour, int minute) {
        ReminderScheduler.saveAndSchedule(this, frequency, hour, minute);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_REQUEST);
            return;
        }
        if (!notificationsEnabled()) {
            openNotificationSettings();
            return;
        }
        FinancialReminderReceiver.showNotification(this, getString(R.string.notification_welcome_title), getString(R.string.notification_welcome_body));
        Toast.makeText(this, R.string.reminder_saved, Toast.LENGTH_SHORT).show();
        sendNotificationStatusToWeb();
    }

    private void sendNotificationStatusToWeb() {
        if (webView == null) return;
        boolean enabled = notificationsEnabled();
        webView.post(() -> webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('mali-notification-status',{detail:{enabled:" + enabled + "}}));",
                null));
    }

    private void beginExport(String value) {
        if (value == null || value.isEmpty() || value.getBytes(StandardCharsets.UTF_8).length > MAX_BACKUP_BYTES) {
            Toast.makeText(this, "تعذر تجهيز النسخة الاحتياطية", Toast.LENGTH_LONG).show();
            return;
        }
        pendingExport = value;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, "mali-backup-" + java.time.LocalDate.now() + ".json");
        startActivityForResult(intent, EXPORT_REQUEST);
    }

    private void beginImport() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        startActivityForResult(intent, IMPORT_REQUEST);
    }

    private void writeExport(Uri uri) {
        if (uri == null || pendingExport == null) return;
        try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
            if (output == null) throw new IllegalStateException("No output stream");
            output.write(pendingExport.getBytes(StandardCharsets.UTF_8));
            output.flush();
            Toast.makeText(this, "تم تصدير نسخة مالي بنجاح", Toast.LENGTH_LONG).show();
        } catch (Exception error) {
            Toast.makeText(this, "تعذر حفظ ملف النسخة الاحتياطية", Toast.LENGTH_LONG).show();
        } finally {
            pendingExport = null;
        }
    }

    private void readImport(Uri uri) {
        if (uri == null) return;
        try (InputStream input = getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IllegalStateException("No input stream");
            byte[] buffer = new byte[8192];
            int count;
            int total = 0;
            while ((count = input.read(buffer)) != -1) {
                total += count;
                if (total > MAX_BACKUP_BYTES) throw new IllegalArgumentException("Backup is too large");
                output.write(buffer, 0, count);
            }
            String json = output.toString(StandardCharsets.UTF_8.name());
            String quoted = JSONObject.quote(json);
            webView.evaluateJavascript(
                    "window.MaliApp&&window.MaliApp.receiveImportedData(" + quoted + ");",
                    null);
        } catch (Exception error) {
            Toast.makeText(this, "ملف النسخة الاحتياطية غير صالح أو تعذر قراءته", Toast.LENGTH_LONG).show();
        }
    }

    private final class MaliBridge {
        @JavascriptInterface
        public boolean notificationsEnabled() {
            return MainActivity.this.notificationsEnabled();
        }

        @JavascriptInterface
        public void scheduleReminder(String frequency, int hour, int minute) {
            runOnUiThread(() -> MainActivity.this.scheduleReminder(frequency, hour, minute));
        }

        @JavascriptInterface
        public void cancelReminder() {
            runOnUiThread(() -> {
                ReminderScheduler.cancel(MainActivity.this);
                Toast.makeText(MainActivity.this, R.string.reminder_stopped, Toast.LENGTH_SHORT).show();
                sendNotificationStatusToWeb();
            });
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            runOnUiThread(MainActivity.this::openNotificationSettings);
        }

        @JavascriptInterface
        public void setSystemDarkMode(boolean dark) {
            runOnUiThread(() -> MainActivity.this.applySystemTheme(dark));
        }

        @JavascriptInterface
        public void persistFinanceData(String value) {
            if (value == null || value.isEmpty() || value.getBytes(StandardCharsets.UTF_8).length > MAX_BACKUP_BYTES) return;
            getSharedPreferences(FINANCE_PREFS, MODE_PRIVATE).edit().putString(FINANCE_DATA_KEY, value).apply();
        }

        @JavascriptInterface
        public String loadFinanceData() {
            return getSharedPreferences(FINANCE_PREFS, MODE_PRIVATE).getString(FINANCE_DATA_KEY, "");
        }

        @JavascriptInterface
        public void requestExport(String value) {
            runOnUiThread(() -> beginExport(value));
        }

        @JavascriptInterface
        public void requestImport() {
            runOnUiThread(MainActivity.this::beginImport);
        }
    }

    private void clearWebCacheAfterUpgrade() {
        int previousVersion = getSharedPreferences("mali_app", MODE_PRIVATE)
                .getInt("web_cache_version", 0);
        if (previousVersion == WEB_CACHE_VERSION) return;
        webView.clearCache(true);
        getSharedPreferences("mali_app", MODE_PRIVATE)
                .edit()
                .putInt("web_cache_version", WEB_CACHE_VERSION)
                .apply();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null) {
            if (requestCode == EXPORT_REQUEST) pendingExport = null;
            return;
        }
        if (requestCode == EXPORT_REQUEST) writeExport(data.getData());
        else if (requestCode == IMPORT_REQUEST) readImport(data.getData());
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != NOTIFICATION_REQUEST) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            FinancialReminderReceiver.showNotification(this, getString(R.string.notification_welcome_title), getString(R.string.notification_welcome_body));
            Toast.makeText(this, R.string.reminder_saved, Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, R.string.notifications_blocked, Toast.LENGTH_LONG).show();
        }
        sendNotificationStatusToWeb();
    }

    @Override
    protected void onResume() {
        super.onResume();
        sendNotificationStatusToWeb();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        webView.removeJavascriptInterface("MaliAndroid");
        webView.stopLoading();
        webView.destroy();
        super.onDestroy();
    }
}
