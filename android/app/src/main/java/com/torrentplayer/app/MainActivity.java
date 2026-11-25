package com.torrentplayer.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.ServiceWorkerClientCompat;
import androidx.webkit.ServiceWorkerControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewFeature;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends AppCompatActivity {

    private FrameLayout rootContainer;
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> uploadMessage;
    private final static int FILECHOOSER_RESULTCODE = 1;

    // Fullscreen / Custom View handling
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private boolean isImmersive = false;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        rootContainer = new FrameLayout(this);
        rootContainer.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        rootContainer.addView(webView);
        setContentView(rootContainer);

        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            try {
                ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(new ServiceWorkerClientCompat() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                        return assetLoader.shouldInterceptRequest(request.getUrl());
                    }
                });
            } catch (Exception ignored) {}
        }

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Append custom user-agent indicator for native mobile app feel
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " TorrentPlayerApp/2.2.0 NativeMobile");

        // Native Android JavaScript Bridge
        webView.addJavascriptInterface(new WebAppInterface(), "Android");

        // Download Listener for native file downloads
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                downloadViaDownloadManager(url, fileName, mimetype);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                }
                uploadMessage = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    uploadMessage = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    onHideCustomView();
                    return;
                }
                customView = view;
                customViewCallback = callback;

                webView.setVisibility(View.GONE);
                rootContainer.addView(customView, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT));

                enterImmersiveMode(true);
            }

            @Override
            public void onHideCustomView() {
                if (customView == null) return;

                rootContainer.removeView(customView);
                customView = null;
                webView.setVisibility(View.VISIBLE);

                exitImmersiveMode();

                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("magnet:") || url.startsWith("intent:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                        return false;
                    }
                }
                return false;
            }
        });

        handleIntent(getIntent());

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (customView != null) {
                    // Exit fullscreen on back press
                    if (webView.getWebChromeClient() != null) {
                        // Triggers onHideCustomView
                        customViewCallback.onCustomViewHidden();
                    }
                    rootContainer.removeView(customView);
                    customView = null;
                    webView.setVisibility(View.VISIBLE);
                    exitImmersiveMode();
                } else if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && isImmersive) {
            enterImmersiveMode(false);
        }
    }

    private void enterImmersiveMode(boolean landscape) {
        isImmersive = true;
        runOnUiThread(() -> {
            try {
                WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            } catch (Exception ignored) {}

            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            insetsController.hide(WindowInsetsCompat.Type.systemBars());
            insetsController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);

            try {
                getWindow().getDecorView().setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN);
            } catch (Exception ignored) {}

            if (landscape) {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            }
        });
    }

    private void exitImmersiveMode() {
        isImmersive = false;
        runOnUiThread(() -> {
            try {
                WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
            } catch (Exception ignored) {}

            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            insetsController.show(WindowInsetsCompat.Type.systemBars());

            try {
                getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
            } catch (Exception ignored) {}

            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        });
    }

    private String getResolvedMimeType(String fileName, String fallback) {
        if (fileName != null && !fileName.isEmpty()) {
            String ext = "";
            int idx = fileName.lastIndexOf('.');
            if (idx >= 0) {
                ext = fileName.substring(idx + 1).toLowerCase();
            }
            if (!ext.isEmpty()) {
                String mime = android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                if (mime != null && !mime.isEmpty()) {
                    return mime;
                }
                if (ext.equals("mp4")) return "video/mp4";
                if (ext.equals("mkv")) return "video/x-matroska";
                if (ext.equals("webm")) return "video/webm";
                if (ext.equals("avi")) return "video/x-msvideo";
                if (ext.equals("mov")) return "video/quicktime";
                if (ext.equals("ts")) return "video/mp2t";
                if (ext.equals("mp3")) return "audio/mpeg";
                if (ext.equals("flac")) return "audio/flac";
                if (ext.equals("aac")) return "audio/aac";
                if (ext.equals("ogg")) return "audio/ogg";
                if (ext.equals("srt")) return "application/x-subrip";
                if (ext.equals("vtt")) return "text/vtt";
            }
        }
        if (fallback != null && !fallback.isEmpty() && !fallback.contains("*")) {
            return fallback;
        }
        return "video/mp4";
    }

    private void downloadViaDownloadManager(String url, String fileName, String mimeType) {
        try {
            if (url == null || url.isEmpty()) return;

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setMimeType(mimeType != null && !mimeType.isEmpty() ? mimeType : "video/*");
            request.setDescription("Downloading torrent video file");
            request.setTitle(fileName != null && !fileName.isEmpty() ? fileName : "video.mp4");
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

            DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager != null) {
                manager.enqueue(request);
                Toast.makeText(this, "Downloading: " + fileName, Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Download error: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    public class WebAppInterface {

        private OutputStream activeDownloadStream = null;
        private Uri activeDownloadUri = null;
        private File activeDownloadFile = null;

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public boolean startNativeDownload(String fileName, String mimeType) {
            try {
                if (activeDownloadStream != null) {
                    try { activeDownloadStream.close(); } catch (Exception ignored) {}
                    activeDownloadStream = null;
                }

                String resolvedMime = getResolvedMimeType(fileName, mimeType);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, resolvedMime);
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                    ContentResolver resolver = getContentResolver();
                    activeDownloadUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (activeDownloadUri != null) {
                        activeDownloadStream = resolver.openOutputStream(activeDownloadUri);
                        return true;
                    }
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (!dir.exists()) dir.mkdirs();
                    activeDownloadFile = new File(dir, fileName);
                    activeDownloadStream = new FileOutputStream(activeDownloadFile);
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public boolean writeNativeChunk(String base64Chunk) {
            try {
                if (activeDownloadStream != null && base64Chunk != null) {
                    byte[] bytes = Base64.decode(base64Chunk, Base64.DEFAULT);
                    activeDownloadStream.write(bytes);
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public boolean finishNativeDownload(String fileName) {
            try {
                if (activeDownloadStream != null) {
                    activeDownloadStream.flush();
                    activeDownloadStream.close();
                    activeDownloadStream = null;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && activeDownloadUri != null) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    getContentResolver().update(activeDownloadUri, values, null, null);
                } else if (activeDownloadFile != null) {
                    MediaScannerConnection.scanFile(MainActivity.this, new String[]{activeDownloadFile.getAbsolutePath()}, null, null);
                }
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Saved to Downloads: " + fileName, Toast.LENGTH_LONG).show());
                return true;
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public void abortNativeDownload() {
            try {
                if (activeDownloadStream != null) {
                    activeDownloadStream.close();
                    activeDownloadStream = null;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && activeDownloadUri != null) {
                    getContentResolver().delete(activeDownloadUri, null, null);
                    activeDownloadUri = null;
                } else if (activeDownloadFile != null && activeDownloadFile.exists()) {
                    activeDownloadFile.delete();
                    activeDownloadFile = null;
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public boolean copyToClipboard(String text) {
            if (text == null) return false;
            runOnUiThread(() -> {
                try {
                    android.content.ClipboardManager clipboard = (android.content.ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    android.content.ClipData clip = android.content.ClipData.newPlainText("Torrent Link", text);
                    if (clipboard != null) {
                        clipboard.setPrimaryClip(clip);
                        Toast.makeText(MainActivity.this, "Copied link to clipboard", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception ignored) {}
            });
            return true;
        }

        @JavascriptInterface
        public void downloadFile(String url, String fileName, String mimeType) {
            runOnUiThread(() -> downloadViaDownloadManager(url, fileName, mimeType));
        }

        @JavascriptInterface
        public void saveBase64File(String base64Data, String fileName, String mimeType) {
            new Thread(() -> {
                try {
                    String cleanBase64 = base64Data;
                    if (cleanBase64.contains(",")) {
                        cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                    }
                    byte[] bytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                    String resolvedMime = getResolvedMimeType(fileName, mimeType);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                        values.put(MediaStore.MediaColumns.MIME_TYPE, resolvedMime);
                        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                        ContentResolver resolver = getContentResolver();
                        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                        if (uri != null) {
                            try (OutputStream out = resolver.openOutputStream(uri)) {
                                if (out != null) {
                                    out.write(bytes);
                                    out.flush();
                                }
                            }
                            values.clear();
                            values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                            resolver.update(uri, values, null, null);
                        }
                    } else {
                        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                        if (!dir.exists()) dir.mkdirs();
                        File file = new File(dir, fileName);
                        try (FileOutputStream fos = new FileOutputStream(file)) {
                            fos.write(bytes);
                            fos.flush();
                        }
                        MediaScannerConnection.scanFile(MainActivity.this, new String[]{file.getAbsolutePath()}, null, null);
                    }

                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Saved to Downloads: " + fileName, Toast.LENGTH_LONG).show());
                } catch (Exception e) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Save error: " + e.getMessage(), Toast.LENGTH_LONG).show());
                }
            }).start();
        }

        @JavascriptInterface
        public void enterImmersiveFullscreen(boolean landscape) {
            enterImmersiveMode(landscape);
        }

        @JavascriptInterface
        public void exitImmersiveFullscreen() {
            exitImmersiveMode();
        }

        @JavascriptInterface
        public void toggleRotation() {
            runOnUiThread(() -> {
                int current = getRequestedOrientation();
                if (current == ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE || current == ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE) {
                    exitImmersiveMode();
                } else {
                    enterImmersiveMode(true);
                }
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        String targetUrl = "https://appassets.androidplatform.net/assets/dist/index.html";
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri data = intent.getData();
            if (data != null) {
                String magnetUri = data.toString();
                targetUrl += "?magnet=" + Uri.encode(magnetUri);
            }
        }
        webView.loadUrl(targetUrl);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (uploadMessage == null) return;
            uploadMessage.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            uploadMessage = null;
        }
    }
}
