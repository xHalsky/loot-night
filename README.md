# Loot Night – Night 1 prototype

Built from the Loot Night design doc (section 10 scope).

    npm install
    npm run dev      # play locally
    npm run build    # single-file dist/index.html
    npx tsx test/sim.ts good   # headless bot plays one night, prints results

All numbers: src/config/tuning.ts. Content: src/data/. Systems: src/systems/. UI: src/ui/.
Debug overlay: F1 (speed x4/x10, spawn visits, interrupts, loot).
