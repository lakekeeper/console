reviewable: install fix-all build 

install:
    npm install

fix-lint:
    npm run lint

check-lint:
    npm run lint:check

dev:
    npm run dev

build:
    npm run build

format:
    npm run format

check-format:
    npm run format:check

check-all: check-format fix-lint

fix-all: format fix-lint
