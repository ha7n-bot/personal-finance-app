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
import android.webkit.CookieManager;
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

public final class MainActivity extends Activity {
    public static final String APP_ORIGIN = "https://personal-finance-app-rose-psi.vercel.app";
    public static final String APP_URL = APP_ORIGIN + "/";
    public static final String CHANNEL_ID = "mali_financial_reminders";
    private static final int NOTIFICATION_REQUEST = 210;
    private WebView webView;
    private ProgressBar progressBar;

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(6, 43, 35));
        getWindow().setNavigationBarColor(Color.rgb(9, 18, 15));
        createNotificationChannel();
        ReminderScheduler.scheduleNext(this);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(9, 18, 15));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(9, 18, 15));
        root.addView(webView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        root.addView(progressBar, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, dp(3)));
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " MaliAndroid/5.0");
        webView.addJavascriptInterface(new MaliBridge(), "MaliAndroid");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
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
                if ("mali".equals(uri.getScheme()) && "auth".equals(uri.getHost())) {
                    openMobileExchange(uri);
                    return true;
                }
                if ("personal-finance-app-rose-psi.vercel.app".equals(uri.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                } catch (Exception ignored) {
                    return false;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                CookieManager.getInstance().flush();
                sendNotificationStatusToWeb();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) view.loadUrl("file:///android_asset/offline.html");
            }
        });

        if (savedInstanceState == null) {
            if (!openMobileExchange(getIntent().getData())) webView.loadUrl(APP_URL);
        } else webView.restoreState(savedInstanceState);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, getString(R.string.notification_channel_name), NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription(getString(R.string.notification_channel_description));
            channel.enableVibration(true);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_REQUEST);
        } else if (!notificationsEnabled()) {
            openNotificationSettings();
        } else {
            if (!ReminderScheduler.isEnabled(this)) ReminderScheduler.saveAndSchedule(this, "daily", 20, 0);
            FinancialReminderReceiver.showNotification(this, getString(R.string.notification_welcome_title), getString(R.string.notification_welcome_body));
            Toast.makeText(this, R.string.notifications_ready, Toast.LENGTH_SHORT).show();
        }
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
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
        webView.post(() -> webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('mali-notification-status',{detail:{enabled:" + enabled + "}}));", null));
    }

    private final class MaliBridge {
        @JavascriptInterface
        public void requestNotifications() {
            runOnUiThread(MainActivity.this::requestNotificationPermission);
        }

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
            });
        }

        @JavascriptInterface
        public void openNotificationSettings() {
            runOnUiThread(MainActivity.this::openNotificationSettings);
        }

        @JavascriptInterface
        public void openExternalAuth(String url) {
            runOnUiThread(() -> {
                Uri uri = Uri.parse(url);
                if (!"https".equals(uri.getScheme()) || !"personal-finance-app-rose-psi.vercel.app".equals(uri.getHost())) return;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                catch (Exception ignored) { Toast.makeText(MainActivity.this, "تعذر فتح تسجيل Google", Toast.LENGTH_LONG).show(); }
            });
        }
    }

    private boolean openMobileExchange(Uri uri) {
        if (uri == null || !"mali".equals(uri.getScheme()) || !"auth".equals(uri.getHost())) return false;
        String token = uri.getQueryParameter("token");
        if (token == null || token.length() < 32) return false;
        webView.loadUrl(APP_ORIGIN + "/mobile-auth/exchange#token=" + Uri.encode(token));
        return true;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        openMobileExchange(intent.getData());
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != NOTIFICATION_REQUEST) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            if (!ReminderScheduler.isEnabled(this)) ReminderScheduler.saveAndSchedule(this, "daily", 20, 0);
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
