package com.ha7n.focusguard;

public final class AppRule {
    public final String packageName;
    public final String label;
    public final int limitMinutes;

    public AppRule(String packageName, String label, int limitMinutes) {
        this.packageName = packageName;
        this.label = label;
        this.limitMinutes = limitMinutes;
    }
}
