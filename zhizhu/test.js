// 定义requestAnimFrame函数
window.requestAnimFrame = function () {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback);
        }
    );
}

// 初始化函数，用于获取canvas元素并返回相关信息
function init(elemid) {
    let canvas = document.getElementById(elemid);
    c = canvas.getContext('2d');
    w = (canvas.width = window.innerWidth);
    h = (canvas.height = window.innerHeight + 200);
    c.fillStyle = "rgba(30,30,30,1)";
    c.fillRect(0, 0, w, h);
    return { c: c, canvas: canvas };
}

window.onload = function () {
    let c = init("canvas").c,
        canvas = init("canvas").canvas,
        colors = ["hsl(210,100%,80%)", "hsl(90,100%,80%)", "hsl(30,100%,80%)", "hsl(360,100%,80%)", "hsl(180,100%,80%)", "hsl(60,100%,80%)"],
        currentColor = colors[0],
        w = (canvas.width = window.innerWidth),
        h = (canvas.height = window.innerHeight),
        mouse = { x: false, y: false },
        last_mouse = {},
        maxl = 100,
        minl = 50,
        n = 30,
        numt = 1000,
        tent = [],
        clicked = false,
        target = { x: 0, y: 0 },
        last_target = {},
        t = 0,
        q = 10;

    function dist(p1x, p1y, p2x, p2y) {
        return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
    }

    class segment {
        constructor(parent, l, a, first) {
            this.first = first;
            if (first) {
                this.pos = { x: parent.x, y: parent.y };
            } else {
                this.pos = { x: parent.nextPos.x, y: parent.nextPos.y };
            }
            this.l = l;
            this.ang = a;
            this.nextPos = {
                x: this.pos.x + this.l * Math.cos(this.ang),
                y: this.pos.y + this.l * Math.sin(this.ang),
            };
        }
        update(t) {
            this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
            this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
            this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);
            this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
            this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
        }
        fallback(t) {
            this.pos.x = t.x;
            this.pos.y = t.y;
            this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
            this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
        }
        show() {
            c.lineTo(this.nextPos.x, this.nextPos.y);
        }
    }

    class tentacle {
        constructor(x, y, l, n, a) {
            this.x = x;
            this.y = y;
            this.l = l;
            this.n = n;
            this.t = {};
            this.rand = Math.random();
            this.segments = [new segment(this, this.l / this.n, 0, true)];
            for (let i = 1; i < this.n; i++) {
                this.segments.push(
                    new segment(this.segments[i - 1], this.l / this.n, 0, false)
                );
            }
        }
        move(last_target, target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            this.dt = dist(last_target.x, last_target.y, target.x, target.y);
            this.t = {
                x: target.x - 0.8 * this.dt * Math.cos(this.angle),
                y: target.y - 0.8 * this.dt * Math.sin(this.angle)
            };
            if (this.t.x) {
                this.segments[this.n - 1].update(this.t);
            } else {
                this.segments[this.n - 1].update(target);
            }
            for (let i = this.n - 2; i >= 0; i--) {
                this.segments[i].update(this.segments[i + 1].pos);
            }
            if (dist(this.x, this.y, target.x, target.y) <= this.l + dist(last_target.x, last_target.y, target.x, target.y)) {
                this.segments[0].fallback({ x: this.x, y: this.y });
                for (let i = 1; i < this.n; i++) {
                    this.segments[i].fallback(this.segments[i - 1].nextPos);
                }
            }
        }
        show(target) {
            const minDisplayLength = 20; // 设置显示的最小长度
            if (dist(this.x, this.y, target.x, target.y) <= this.l && this.l >= minDisplayLength) {
                c.globalCompositeOperation = "lighter";
                c.beginPath();
                c.moveTo(this.x, this.y);
                for (let i = 0; i < this.n; i++) {
                    this.segments[i].show();
                }
                c.strokeStyle = currentColor;
                c.lineWidth = this.rand * 2;
                c.lineCap = "round";
                c.lineJoin = "round";
                c.stroke();
                c.globalCompositeOperation = "source-over";
            }
        }
        show2(target) {
            c.beginPath();
            if (dist(this.x, this.y, target.x, target.y) <= this.l) {
                c.arc(this.x, this.y, 2 * this.rand + 1, 0, 2 * Math.PI);
                c.fillStyle = "white";
            } else {
                c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
                c.fillStyle = "darkcyan";
            }
            c.fill();
        }
    }

    for (let i = 0; i < numt; i++) {
        tent.push(
            new tentacle(
                Math.random() * w,
                Math.random() * h,
                Math.random() * (maxl - minl) + minl,
                n,
                Math.random() * 2 * Math.PI,
            )
        );
    }

    function draw() {
        if (mouse.x) {
            target.errx = mouse.x - target.x;
            target.erry = mouse.y - target.y;
        } else {
            target.errx =
                w / 2 +
                ((h / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
                (Math.pow(Math.sin(t), 2) + 1) - 
                target.x;
            target.erry =
                h / 2 +
                ((h / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
                (Math.pow(Math.sin(t), 2) + 1) -
                target.y;
        }

        target.x += target.errx / 10;
        target.y += target.erry / 10;
        t += 0.01;

        c.beginPath();
        c.arc(
            target.x,
            target.y,
            dist(last_target.x, last_target.y, target.x, target.y) + 5,
            0,
            2 * Math.PI
        );
        c.fillStyle = "hsl(210,100%,80%)";
        c.fill();

        for (let i = 0; i < numt; i++) {
            tent[i].move(last_target, target);
            tent[i].show2(target);
        }

        for (let i = 0; i < numt; i++) {
            tent[i].show(target);
        }

        last_target.x = target.x;
        last_target.y = target.y;
    }

    function loop() {
        window.requestAnimFrame(loop);
        c.clearRect(0, 0, w, h);
        draw();
    }

    window.addEventListener("resize", function () {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        loop();
    });

    loop();
    setInterval(loop, 1000 / 60);

    canvas.addEventListener("mousemove", function (e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);

    canvas.addEventListener("mouseleave", function (e) {
        mouse.x = false;
        mouse.y = false;
    });

    // 监听鼠标单击事件
    canvas.addEventListener("click", function () {
        currentColor = colors[Math.floor(Math.random() * colors.length)];
    });

    // 创建命令行输入框
    let commandInput = document.createElement("input");
    commandInput.type = "text";
    commandInput.style.position = "absolute";
    commandInput.style.top = "10px";
    commandInput.style.left = "10px";
    commandInput.style.display = "none"; // 初始隐藏
    document.body.appendChild(commandInput);

    // 定义显示所有命令及其功能的函数
    function showMenu() {
        const menu = `
        可用命令：
        1. color [颜色] - 更改当前颜色为指定颜色
        2. set length [长度] - 设置蜘蛛腿的最大长度（建议不要改，很丑）
        4. menu - 显示所有可用命令
        `;
        alert(menu);
    }

    // 监听键盘事件
    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.altKey && e.key === "1") {
            commandInput.style.display = commandInput.style.display === "none" ? "block" : "none";
            commandInput.focus(); // 显示时聚焦
        }
    });

    // 监听命令输入
    commandInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const command = commandInput.value.trim();
            if (command === "menu") {
                showMenu(); // 显示命令面板
            } else if (command.startsWith("set color ")) {
                currentColor = command.split("set color ")[1] || currentColor;
                alert("当前颜色已更改为: " + currentColor);
            }  else if (command.startsWith("add ")) {
                const count = parseInt(command.split(" ")[1]);
                if (!isNaN(count)) {
                    for (let i = 0; i < count; i++) {
                        tent.push(
                            new tentacle(
                                Math.random() * w,
                                Math.random() * h,
                                Math.random() * (maxl - minl) + minl,
                                n,
                                Math.random() * 2 * Math.PI,
                            )
                        );
                    }
                    alert(count + "个背景点数已添加！");
                } else {
                    alert("请输入有效的数量");
                }
            } else if (command.startsWith("set length ")) {
                const length = parseFloat(command.split(" ")[2]);
                if (!isNaN(length)) {
                    maxl = length; // 设置最大长度

                    tent.forEach(t => {
                        t.l = maxl; // 设置长度为最大值
                    });

                    alert("蜘蛛腿长度已随机设置为最大值: " + maxl);
                } else {
                    alert("请输入有效的正长度");
                }
            } else if (command.startsWith("set count ")) {
                const count = parseInt(command.split(" ")[2]);
                if (!isNaN(count) && count > 0) {
                    numt = count; // 更新背景点数量
                    alert("背景中点的数量已设置为: " + count);
                } else {
                    alert("请输入有效的数量");
                }
            } else {
                alert("未知命令");
            }
            commandInput.value = ""; // 清空输入框
        }
    });
};