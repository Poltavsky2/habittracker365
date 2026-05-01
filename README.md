# 365 Marathon App

This application is ready for GitHub Pages.

## How to deploy to GitHub Pages

1. **Upload to GitHub**: Push your code to a new repository on GitHub.
2. **Enable Actions**: 
   - Go to your repository on GitHub.
   - Click on **Settings** tab.
   - Click on **Pages** in the left sidebar.
   - Under **Build and deployment** > **Source**, change the dropdown from `Deploy from a branch` to `GitHub Actions`.
3. **Automatic Deployment**: The next time you push to the `main` branch, the application will automatically build and deploy.

## Почему изменения не появляются мгновенно?

Когда вы пушите (загружаете) код на GitHub, запускается процесс **GitHub Actions**:
1. **Сборка (1-2 мин)**: GitHub готовит файлы вашего приложения.
2. **Деплой (1-2 мин)**: GitHub обновляет сайт по ссылке.
**Итого**: Обновление занимает около **3-5 минут**. Это нормально для GitHub.

## Как ускорить?
Если вы хотите видеть изменения мгновенно во время разработки:
- Используйте кнопку **Share (Поделиться)** прямо здесь, в AI Studio. Ссылка отсюда обновляется моментально.
- GitHub Pages лучше использовать уже для финальной версии.

## Исправления
- **Failsafe**: Добавлена принудительная загрузка через 2 секунды, если Telegram SDK не отвечает.
- **Relative Paths**: Настроены относительные пути для стабильной работы на GitHub.
- **Cache**: Добавлен `.nojekyll` для ускорения обработки файлов на сервере GitHub.
