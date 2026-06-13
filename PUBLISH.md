# Publish to npm

GitHub repo đã lên: https://github.com/phamlongh230-lgtm/yana-web

## Còn 2 bước npm — anh chạy khi về:

### 1. Publish yamtam-core (dependency)
```bash
cd ~/yamtam-engine/packages/yamtam-core
npm login
npm publish --access public
```

### 2. Publish yana-web
```bash
cd ~/yana-web
npm publish --access public
```

## Sau khi publish, người dùng chạy:
```bash
npx yana
```

## Nếu muốn scoped package (@phamlongh230/yana):
Sửa name trong package.json thành "@phamlongh230/yana" trước khi publish.
