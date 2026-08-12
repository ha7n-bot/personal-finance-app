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
        versionCode = 14
        versionName = "8.3.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // Stable GitHub Actions key: installable now and updatable by later releases.
            // Replace with a protected Play signing key before publishing to the store.
            signingConfig = signingConfigs.getByName("debug")
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

// مالي 8.3.0: partial monthly commitment payments and simpler commitments UX.
