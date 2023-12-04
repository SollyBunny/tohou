const basic = [
    from => {
        for (let i = -10; i < 11; ++i) {
            objs.add(new Proj(
                from.clone(),
                Vector.fromPolar(0.03, i),
                1,
                2,
            ));
        }
    },
    async from => {
        const dir = from.dirWith(player.pos);
        for (let i = 0; i < 10; ++i) {
            objs.add(new Proj(
                from.clone(),
                Vector.fromPolar(0.05, dir - 0.4),
                1,
                0
            ));
            objs.add(new Proj(
                from.clone(),
                Vector.fromPolar(0.05, dir),
                1,
                0
            ));
            objs.add(new Proj(
                from.clone(),
                Vector.fromPolar(0.05, dir + 0.4),
                1,
                0
            ));
            await sleep(0.1);
        }
    },
    from => {
        from.x = Math.random() * 10;
        for (; from.x < width - 10; from.x += 30) {
            objs.add(new Proj(
                from.clone(),
                new Vector(0, 0.05),
                2,
                2
            ));
        }
    },
];
const target = [
    from => {
        objs.add(new Proj(
            from.clone(),
            Vector.fromPolar(0.1, Math.random() * 2 * Math.PI),
            3,
            undefined,
            5000
        ));
    },
    async from => {
        for (let i = 0; i < 10; ++i) {
            objs.add(new Proj(
                from.clone(),
                Vector.fromPolar(0.05, from.dirWith(player.pos)),
                4,
                0
            ));
            await sleep(0.5);
        }
    }
];
const special = [
    async from => {
        let dir = Math.random() * 2 * Math.PI;
        for (let i = 0; i < 160; ++i) {
            objs.add(new Proj(
                from.clone(),
                Vector.fromPolar(0.03, dir),
                1,
                200
            ));
            objs.add(new Proj(
                from.clone(),
                Vector.fromPolar(0.02, dir + Math.PI),
                0,
                200
            ));
            dir += 0.2
            await sleep(0.1);
        }
    },
    async from => {
        let startx = 25;
        for (let i = 0; i < 10; ++i) {
            from.x = startx;
            startx = 50 - startx;
            for (; from.x < width - 10; from.x += 30) {
                objs.add(new Proj(
                    from.clone(),
                    new Vector(0, 0.05),
                    2,
                    2
                ));
            }
        }
    },
]