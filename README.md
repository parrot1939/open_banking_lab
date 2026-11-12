# Open Banking Ops Lab

Projekt portfolio pod utrzymanie aplikacji i automatyzację w zespole Open Banking. Aplikacja udostępnia wyłącznie fikcyjne salda demonstracyjne. Do uruchomienia lokalnego potrzebujesz Dockera z Compose oraz curl.

```mermaid
flowchart LR
    Client["curl lub przeglądarka"] --> Proxy["Nginx · port 8080"]
    Proxy --> API["Node.js · port 3000"]
    API --> DB["PostgreSQL · port 5432"]
```

Na hoście dostępny jest tylko port Nginx, domyślnie na 127.0.0.1. Kontenery korzystają z nazw usług w DNS Dockera. Salda zapisujemy w groszach. Hasło w Compose służy wyłącznie do odtworzenia lokalnego środowiska.

## Uruchomienie i test awarii

Z katalogu głównego wykonaj:

```bash
docker compose up -d --build
docker compose ps
curl -i http://127.0.0.1:8080/health/ready
curl -i http://127.0.0.1:8080/api/balances
sh ops/smoke.sh
```

Test przechodzi przez Nginx, zatrzymuje bazę, sprawdza odpowiedzi aplikacji i uruchamia bazę ponownie. Na końcu sprawdza powrót dostępności. Przykładowe salda to DEMO-01 z 12500 gr i DEMO-02 z 4520 gr.

| Endpoint | Baza działa | Baza zatrzymana |
|---|---:|---:|
| /health/live | 200 | 200 |
| /health/ready | 200 | 503 |
| /api/balances | 200 | 503 |

Aplikacja może przyjmować połączenia nawet przy niedostępnej bazie. Sygnał gotowości wykonuje SELECT 1. Oddzielne sprawdzenie życia procesu pomaga uniknąć restartowania aplikacji w czasie awarii bazy.

## Runbook dla odpowiedzi 503

1. Sprawdź `curl -i http://127.0.0.1:8080/health/live` oraz `/health/ready`. Kombinacja 200 i 503 kieruje diagnostykę do zależności aplikacji.
2. Sprawdź stan kontenerów i ostatnie zdarzenia: `docker compose ps -a` oraz `docker compose logs --tail=50 proxy api db`. W logu aplikacji szukaj `database_query_failed` i kodu błędu.
3. Jeśli baza działa, sprawdź DNS z sieci aplikacji poleceniem `docker compose exec api getent hosts db` i gotowość bazy przez `docker compose exec db pg_isready -U demo -d demo`. Zweryfikuj schemat poleceniem `docker compose exec db psql -U demo -d demo -c 'SELECT COUNT(*) FROM demo_balance;'`.
4. W scenariuszu celowego zatrzymania wykonaj `docker compose start db`. Potwierdź powrót HTTP 200 na gotowości i saldach. Zapisz objaw, przyczynę i wynik weryfikacji.

Po zakończeniu `docker compose down` zatrzymuje środowisko i zachowuje wolumen bazy.

## GitLab CI

Job `unit` sprawdza odpowiedzi HTTP i powrót aplikacji po symulowanej utracie bazy. Uruchomisz go lokalnie poleceniem `node --test` bez instalowania zależności. Job `integration` buduje trzy obrazy, uruchamia Compose, wykonuje test awarii i zapisuje logi kontenerów jako artefakt. Wymaga izolowanego runnera GitLab z obsługą Docker-in-Docker w trybie privileged. Port integracyjny jest wtedy dostępny w sieci joba.

Status weryfikacji: test Node.js przeszedł lokalnie, a składnia skryptu powłoki została sprawdzona. Uruchomienie Compose i joba GitLab wymaga środowiska z Dockerem. Projekt używa Node.js i PostgreSQL. Zakres obejmuje lokalne utrzymanie aplikacji, testy i diagnostykę.
