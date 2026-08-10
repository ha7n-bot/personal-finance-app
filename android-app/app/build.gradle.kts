plugins {
    id("com.android.application")
}

android {
    namespace = "com.ha7n.mali"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ha7n.mali"
        minSdk = 24
        targetSdk = 35
        versionCode = 4
        versionName = "4.0.0"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".preview"
            versionNameSuffix = "-preview"
            resValue("string", "app_name", "مالي التجريبي")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
