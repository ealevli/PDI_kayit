@echo off
title PDI System Launcher
echo PDI Uygulamasi Baslatiliyor...
:: Klasör içindeyken dotnet run komutu doğrudan .csproj dosyasını bulur
dotnet run --project PDI_WPF.csproj
pause
