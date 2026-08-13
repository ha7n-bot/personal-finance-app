package com.ha7n.focusguard;

import android.accessibilityservice.AccessibilityService;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class LimitAccessibilityService extends AccessibilityService {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WindowManager windowManager;
    private View blockerView;
    private String monitoredPackage;
    private String blockedPackage;

    private final Runnable monitorRunnable = new Runnable() {
        @Override
        public void run() {
            checkCurrentPackage();
            handler.postDelayed(this, 2500L);
        }
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        handler.removeCallbacks(monitorRunnable);
        handler.post(monitorRunnable);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getPackageName() == null) return;
        String pkg = event.getPackageName().toString();

        if (getPackageName().equals(pkg) || "com.android.systemui".equals(pkg)) return;

        monitoredPackage = pkg;
        if (blockedPackage != null && !blockedPackage.equals(pkg)) {
            hideBlocker();
        }
        checkCurrentPackage();
    }

    private void checkCurrentPackage() {
        String pkg = monitoredPackage;
        if (pkg == null || getPackageName().equals(pkg)) return;

        int limitMinutes = RuleStore.getLimitMinutes(this, pkg);
        if (limitMinutes <= 0) {
            if (blockedPackage != null && blockedPackage.equals(pkg)) hideBlocker();
            return;
        }

        if (!UsageAccessHelper.hasUsageAccess(this)) return;

        long used = UsageAccessHelper.getTodayUsageMillis(this, pkg);
        long limitMillis = limitMinutes * 60_000L;
        if (used >= limitMillis) {
            showBlocker(pkg, RuleStore.getLabel(this, pkg), limitMinutes, used);
        } else if (blockedPackage != null && blockedPackage.equals(pkg)) {
            hideBlocker();
        }
    }

    private void showBlocker(String pkg, String label, int limitMinutes, long usedMillis) {
        if (blockerView != null && pkg.equals(blockedPackage)) return;
        hideBlocker();
        blockedPackage = pkg;

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(28), dp(32), dp(28), dp(32));
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        root.setBackgroundColor(Color.rgb(15, 23, 42));

        TextView lock = new TextView(this);
        lock.setText("⏳");
        lock.setTextSize(52f);
        lock.setGravity(Gravity.CENTER);
        root.addView(lock, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        TextView title = new TextView(this);
        title.setText("انتهى وقت " + label);
        title.setTextColor(Color.WHITE);
        title.setTextSize(26f);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        titleParams.topMargin = dp(18);
        root.addView(title, titleParams);

        TextView message = new TextView(this);
        message.setText("وصلت إلى الحد اليومي: " + formatLimit(limitMinutes)
                + "\nالاستخدام اليوم: " + UsageAccessHelper.formatMinutes(usedMillis)
                + "\n\nسيُفتح التطبيق من جديد تلقائيًا بعد منتصف الليل.");
        message.setTextColor(Color.rgb(203, 213, 225));
        message.setTextSize(17f);
        message.setGravity(Gravity.CENTER);
        message.setLineSpacing(0f, 1.25f);
        LinearLayout.LayoutParams msgParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        msgParams.topMargin = dp(16);
        root.addView(message, msgParams);

        Button home = new Button(this);
        home.setText("العودة للشاشة الرئيسية");
        home.setTextSize(17f);
        home.setTextColor(Color.WHITE);
        home.setAllCaps(false);
        GradientDrawable buttonBg = new GradientDrawable();
        buttonBg.setColor(Color.rgb(37, 99, 235));
        buttonBg.setCornerRadius(dp(14));
        home.setBackground(buttonBg);
        home.setOnClickListener(v -> {
            hideBlocker();
            performGlobalAction(GLOBAL_ACTION_HOME);
        });
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(56));
        buttonParams.topMargin = dp(28);
        root.addView(home, buttonParams);

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;

        try {
            windowManager.addView(root, params);
            blockerView = root;
        } catch (Exception ignored) {
            blockerView = null;
            blockedPackage = null;
        }
    }

    private void hideBlocker() {
        if (blockerView != null && windowManager != null) {
            try {
                windowManager.removeView(blockerView);
            } catch (Exception ignored) {
            }
        }
        blockerView = null;
        blockedPackage = null;
    }

    private String formatLimit(int minutes) {
        int h = minutes / 60;
        int m = minutes % 60;
        if (h > 0 && m > 0) return h + " ساعة و" + m + " دقيقة";
        if (h > 0) return h + " ساعة";
        return m + " دقيقة";
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onInterrupt() {
        hideBlocker();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(monitorRunnable);
        hideBlocker();
        super.onDestroy();
    }
}
