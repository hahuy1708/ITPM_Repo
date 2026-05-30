# Models Registry

Mongoose models now live inside feature modules under `src/modules/*/*.model.js`.

This folder keeps `index.js` as a compatibility registry so existing imports can use:

```js
const { User, Task, Project } = require("../models");
```

New code should prefer the module boundary for feature-specific work and use this registry only for cross-module compatibility.
