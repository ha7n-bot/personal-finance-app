plugins {
    id("com.android.application")
}

val releaseStoreFile = System.getenv("MALI_SIGNING_STORE_FILE")
val releaseStorePassword = System.getenv("MALI_SIGNING_STORE_PASSWORD")
val allowDebugSigning = System.getenv("MALI_ALLOW_DEBUG_SIGNING") == "1"
val hasReleaseSigning = !releaseStoreFile.isNullOrBlank() && !releaseStorePassword.isNullOrBlank()

if (!hasReleaseSigning && !allowDebugSigning) {
    throw org.gradle.api.GradleException(
        "Permanent Mali release signing credentials are required. Refusing to create an update with an ephemeral debug key."
    )
}

android {
    namespace = "com.ha7n.mali"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ha7n.mali"
        minSdk = 24
        targetSdk = 35
        versionCode = 16
        versionName = "8.5.0"
    }

    signingConfigs {
        create("maliRelease") {
            if (hasReleaseSigning) {
                storeFile = file(releaseStoreFile!!)
                storePassword = releaseStorePassword
                keyAlias = "mali"
                keyPassword = releaseStorePassword
                storeType = "PKCS12"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (hasReleaseSigning) {
                signingConfigs.getByName("maliRelease")
            } else {
                // Pull-request validation only. This APK is never published.
                signingConfigs.getByName("debug")
            }
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

// مالي 8.5.0: stable v8 feature set with a redesigned v9-inspired interface layer.