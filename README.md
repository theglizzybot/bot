```html-live
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #c9d1d9; background: #0d1117; display: flex; flex-direction: column;
      align-items: center; justify-content: center; height: 100vh; margin: 0;
    }
    .ball {
      width: 50px; height: 50px; background: #238636; border-radius: 50%;
      position: relative; animation: bounce 1s infinite alternate;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    @keyframes bounce {
      from { top: -50px; } to { top: 50px; }
    }
    button {
      margin-top: 40px; padding: 10px 20px; background: #21262d; 
      color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; cursor: pointer;
    }
    button:hover { background: #30363d; }
  </style>
</head>
<body>
  <div class="ball"></div>
  <button onclick="alert('JavaScript läuft absolut sicher im sandboxed Iframe!')">Klick mich</button>
</body>
</html>
```
```api-request
GET https://gurkistanwiki.gurken.site/api/api.php?c=pages&id=gurkistan
```

