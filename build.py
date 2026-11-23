r=lambda p:open(p).read()
css=r('src/base/css.css')+r('src/extra.css')
land=r('src/base/landing.html').replace("Elijan la voz que más les guste en ⚙️ (arriba a la derecha, ya dentro).","Elijan la voz en ⚙️. Si entran a un local, la guía se pausa sola y retoma al caminar.")
photos=r('src/base/photos.js').replace('sol:PH.sagra','sol:PH.valle')
html=f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Toledo">
<meta name="theme-color" content="#140f0b">
<title>Toledo a pie · Audioguía</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,400;1,9..144,600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>{css}</style>
</head>
<body>
{land}
{r('src/app.html')}
{r('src/base/sheet.html')}
<div class="toast" id="toast"></div>
<script>
{r('src/base/content.js')}
{photos}
{r('src/stories.js')}
{r('src/more.js')}
{r('src/main.js')}
{r('src/base/landing.js')}
</script>
</body>
</html>
'''
open('index.html','w').write(html)
