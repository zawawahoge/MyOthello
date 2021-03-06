$(function () {
    const cnvs = $("#cnvs");
    if (ww < 600) {
        $("#cnvs").attr("width", ww);
        $("#cnvs").attr("height", ww);
    }
    cnvs.css("background-color", "darkgreen");

    const TURN = {
        NONE: 0,
        BLACK: 1,
        WHITE: 2
    }

    class GUI {
        constructor(Nsize, width, maneger) {
            this.Nsize = Nsize;
            this.width = width;
            this.cellsize = width / (Nsize + 1);
            this.mouse = { x: 0, y: 0 };
            this.Imouse = { xi: -1, yi: -1 };
            this.busy = false;
            this.ctx = cnvs[0].getContext("2d");
            this.maneger = maneger;
			this.thinking = false;
        }
        showSimulation() {
            var results = this.results;
            var ctx = this.ctx;
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.font = "100px sans-serif";
            ctx.fillText(results, this.width / 2, this.width / 2, 1000);
        }
        DrawBoard(board) {
            var ctx = this.ctx;
            //clear board
            this.ctx.clearRect(0, 0, this.width, this.width);
            //draw empty board
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            for (var i = 0; i <= this.Nsize; i++) {
                ctx.moveTo(this.cellsize * (i + 1 / 2), this.cellsize / 2);
                ctx.lineTo(this.cellsize * (i + 1 / 2), this.cellsize * (this.Nsize + 1 / 2));
                ctx.moveTo(this.cellsize / 2, this.cellsize * (i + 1 / 2));
                ctx.lineTo(this.cellsize * (this.Nsize + 1 / 2), this.cellsize * (i + 1 / 2));
            }
            ctx.closePath();
            ctx.stroke();
			
			if(this.maneger.lastte != null && this.maneger.gameChu){
				var xi = this.maneger.lastte[0];
				var yi = this.maneger.lastte[1];
				ctx.rect(this.cellsize + (xi - 1/2) * this.cellsize + 1,
						 this.cellsize + (yi - 1/2) * this.cellsize + 1,
						 this.cellsize - 2,
						 this.cellsize - 2
						 )
				ctx.fillStyle = "rgba(128, 128, 128, 0.8)";
				ctx.fill();
						 
			}
            // draw discs
            for (var xi = 0; xi < this.Nsize; xi++) {
                for (var yi = 0; yi < this.Nsize; yi++) {
                    if (board[yi][xi] != TURN.NONE) {
                        ctx.beginPath();
                        ctx.arc(
                            this.cellsize + xi * this.cellsize,
                            this.cellsize + yi * this.cellsize,
                            this.cellsize * 0.4,
                            0,
                            Math.PI * 2,
                            true
                        );
                        if (board[yi][xi] == TURN.BLACK) {
                            ctx.fillStyle = "black";
                        } else {
                            ctx.fillStyle = "white";
                        }
                        ctx.fill();
                    }
                }
            }

            for (let arr of this.maneger.get_okeru()) {
                var xi = arr[0]; var yi = arr[1];
                ctx.beginPath();
                ctx.arc(
                    this.cellsize + xi * this.cellsize,
                    this.cellsize + yi * this.cellsize,
                    this.cellsize * 0.1,
                    0,
                    Math.PI * 2,
                    true
                );
				if(this.maneger.game.turn == TURN.BLACK) ctx.fillStyle = "#303030";
				if(this.maneger.game.turn == TURN.WHITE) ctx.fillStyle = "#b0b0b0";
                //ctx.fillStyle = "gray";
                ctx.fill();
            }

            if (this.passtimer > 0) {
                var ss = "";
                if (this.passturn == TURN.BLACK) ss = "黒";
                if (this.passturn == TURN.WHITE) ss = "白";
                var ctx = this.ctx;
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.font = "50px sans-serif";
                ctx.fillText(ss + "：　パス", this.width / 2, this.width / 2, 1000);
                this.passtimer -= 1;
            }

            if (this.finishtimer > 0) {
                var ss = "引き分け！";
                if (this.finishResult == TURN.BLACK) ss = "黒の勝利！";
                if (this.finishResult == TURN.WHITE) ss = "白の勝利！";

                var ctx = this.ctx;
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.font = "50px sans-serif";
                ctx.fillText(ss, this.width / 2, this.width / 2, 1000);
                this.finishtimer -= 1;
                if (this.finishtimer == 1) {
                    this.maneger.showMenu();
                }
            }
			if (this.thinking){
                var ss = "思考中...";
                var ctx = this.ctx;
                ctx.fillStyle = "grey";
                ctx.textAlign = "center";
                ctx.font = "50px sans-serif";
                ctx.fillText(ss, this.width / 2, this.width / 2, 1000);
			}

        }

        DrawBoardWithAnimation() {

        }
        showPass(turn) {
            this.passtimer = 10;
            this.passturn = turn;
        }
		showThinking(){
			this.thinking = true;
		}
        showFinishMessege(turn, result) {
            this.passtimer = 0;
            //this.passturn = turn;
            this.finishtimer = 45;
            this.finishResult = result;
        }
        update(mouse) {
            this.update_mouse(mouse);
			this.click();
        }
		click(){
			if(!clicked) return;
			if (0 <= this.Imouse.xi
				& this.Imouse.xi < this.Nsize & 0 <= this.Imouse.yi & this.Imouse.yi < this.Nsize) {
				// ボードの中でクリックされたとき
				this.maneger.get_hand_from_gui(this.Imouse);
			}
			clicked = false;
		}
        update_mouse(mouse) {
            this.mouse.x = mouse.x;
            this.mouse.y = mouse.y;
            var xi = parseInt((this.mouse.x - this.cellsize / 2) / this.cellsize);
            var yi = parseInt((this.mouse.y - this.cellsize / 2) / this.cellsize);
            this.Imouse.xi = xi;
            this.Imouse.yi = yi;
        }

    }

    class OthelloController {
        constructor(Nsize, width) {
            this.Nsize = Nsize;
            this.gui = new GUI(Nsize, width, this);
            this.game = new Othello(Nsize);
            this.gameChu = false;
            this.waiting = false;
            this.okeru = [];
            this.passed = false;
            this.simulating = false;
        }
        update(mouse) {
            this.gui.update(mouse);
            this.gui.DrawBoard(this.game.board);
            clicked = false;
        }
        start() {
            $(".startbtn").hide();
			$(".cpubtn").hide();
			$("#back").show();
            $("#cnvs").removeClass("w3-opacity");
            //$("#infobox").show();
            this.update_to_next();
        }
        start_human() {
            this.gameChu = true;
            this.game = new Othello(this.Nsize);
            this.game.players.push(new Player());
            this.game.players.push(new Player());
            this.start();
        }
        start_cpu(num) {
            this.gameChu = true;
			$("#myChartContainer").show();
            if (num == 1) {
                this.game = new Othello(this.Nsize);
                this.game.players.push(new Player());
                this.game.players.push(new CPUMonteCarloEval(this.game, 100));
                //this.game.players.push(new CPU(this.game));
            }
            if (num == 2) {
                this.game = new Othello(this.Nsize);
                this.game.players.push(new Player());
                this.game.players.push(new CPUMonteCarloEval(this.game, 1000));
                //this.game.players.push(new CPUOkeruRandom(this.game));
            }
            if (num == 3) {
                this.game = new Othello(this.Nsize);
                this.game.players.push(new Player());
                this.game.players.push(new CPUMonteCarloEval(this.game, 3000));
            }
            if (num == 4) {
                this.game = new Othello(this.Nsize);
                this.game.players.push(new Player());
                this.game.players.push(new CPUMonteCarloEval(this.game, 10000));
            }
            if (num == 5) {
                this.game = new Othello(this.Nsize);
                //this.game.players.push(new CPUEval(this.game));
                //this.game.players.push(new CPUMonteCarloTreeHashi(this.game, 1000));
                //this.game.players.push(new CPUMonteCarloEval(this.game, 10000, 30, 5, 0.4));
                this.game.players.push(new Player());
                this.game.players.push(new CPUMonteCarloEval(this.game, 20000, 30, 5, 0.4));
                //this.game.players.push(new CPUMonteCarloEval(this.game, 6000, 30, 5, 0.4));
                //this.game.players.push(new CPUMonteCarloTreeHashi(this.game, 10000, 30, 5, 0.4));
                //this.game.players.push(new CPUMonteCarloTreeHashi(this.game, 30000, 10, 1, 1));
                //this.game.players.push(new CPUMonteCarloTreeHashi(this.game, 30000, 30, 5, 0.4));
            }
            if (num == 11) {
                //CPU同士戦わせる
                $(".startbtn").hide();
                $(".simulation").show();
                var results = [0, 0, 0];
                var ctx = this.gui.ctx;
                this.simulating = true;
				//players.push(new CPUEval(game));
                for (var i = 0; i < 100; i++) {
					var game = new Othello(this.Nsize);
					var cpu = new CPU(game);
					var players = [];
					players.push(new CPU(game, 100, 30, 5, 0.4));
					players.push(new CPU(game, 100, 30, 5, 0.4));
					//players.push(new CPUEval(game));
					var result = cpu.simulate_from_players(game.Nsize, game.board, game.turn, game, players);
                    results[result] += 1;
					console.log(results);
                }
                $("#label_sim").html("黒: " + results[1] + "<br/>白: " + results[2] + " <br/>引き分け: " + results[0] + "<br/>" + "黒の勝率: " + results[1] / 10 + " %<br/>");
                return;
            }
            this.start();
        }
        get_hand_from_gui(Imouse) {
            // マスをクリックしたときにGUIから呼ばれる関数。
            if (!this.gameChu) return;
            if (this.game.players[this.game.turn - 1].ishuman) {
                if (this.game.check_okeru(Imouse.xi, Imouse.yi)) {
                    // クリックしたところが合法手なら石をひっくり返す
                    this.game.put_disc(Imouse);
                    this.update_to_next();
					this.lastte = [Imouse.xi, Imouse.yi];
                }
            }
        }
        update_to_next() {
            // 石をひっくり返したあとの処理を色々する。（okeruの更新）
			if(!this.gameChu) return;
            this.game.refresh_okeru();
            if (this.game.okeru.length == 0) {
                // 合法手がないとき。
                console.log("pass");
                this.gui.showPass(this.game.turn);
                this.game.turn = 3 - this.game.turn;
                this.game.refresh_okeru();
                if (this.game.okeru.length == 0) {
                    // パスが二回続いたとき終了する。
                    console.log("pass 2");
                    this.finish();
                    return;
                }
                this.update_to_next();
            } else {
                //合法手があるとき
                //CPUなら、手を考える。
                var player = this.game.players[this.game.turn - 1];
                if (player.iscpu) {
					//if (this.game.players[(3-this.game.turn) - 1].iscpu){
					if (false){
						var te = player.think();
						this.game.put_disc({ xi: te[0], yi: te[1] });
						this.update_to_next();
					}else{
						function Temp(maneger, player){
							var te = player.think();
							maneger.game.put_disc({ xi: te[0], yi: te[1] });
							maneger.update_to_next();
							maneger.gui.thinking = false;
							maneger.updateData();
							maneger.lastte = te;
						}
						this.gui.showThinking();
						setTimeout(Temp, 300, this, player);
					}
                }
            }
            // 終了してるか？
            if (this.game.isover()) {
                this.finish();
            }
        }
		updateData(){
			var datasets = [];
			var colors = ["PINK", window.chartColors.red, window.chartColors.blue];
			var labels = ["None", "CPU（黒）", "CPU（白）"];
			for(var i=0; i<this.game.players.length; i++){
				var player = this.game.players[i];
				if(player.iscpu){
					if(player.has_value_history == null) continue;
					var value_history = player.value_history;
					if(i+1 == TURN.WHITE){
						value_history = [];
						for(var j=0; j<player.value_history.length; j++){
							value_history[j] = - player.value_history[j];
						}
					}
					var points = [];
					for(var j=0; j<value_history.length; j++){
						var offset = 1;
						if(i+1 == TURN.WHITE) offset = 2;
						points.push({x: 2*j + offset, y: value_history[j]});
					}
					var data = {
						label: labels[i + 1],
						data: points,
						borderColor: colors[i + 1],
						backgroundColor: colors[i + 1],
						borderWidth: 1,
						fill: false,
					};
					datasets.push(data);
				}
			}
			myChart.data.datasets = datasets;
			myChart.update();
		}
        finish() {
            var ncolors = this.game.count_colors();
            var result = TURN.NONE;
            if (ncolors["BLACK"] > ncolors["WHITE"]) result = TURN.BLACK;
            if (ncolors["BLACK"] < ncolors["WHITE"]) result = TURN.WHITE;
            this.gui.showFinishMessege(this.game.turn, result);
            this.gameChu = false;
        }
        get_okeru() {
            return this.game.okeru;
        }
        showMenu() {
            $(".startbtn").show();
			$(".cpubtn").hide();
            $("#cnvs").addClass("w3-opacity");
            $("#infobox").hide();
        }
    }

    class Othello {
        constructor(Nsize) {
            this.Nsize = Nsize;
            this.SetInitBoard();
            this.players = [];
            this.turn = 1; // 1: 黒番, 2: 白番

            this.okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru(xi, yi)) {
                        this.okeru.push([xi, yi]);
                    }
                }
            }
        }

        SetInitBoard() {
            this.board = [];
            for (var i = 0; i < this.Nsize; i++) {
                this.board[i] = [];
                for (var j = 0; j < this.Nsize; j++) {
                    this.board[i][j] = TURN.NONE;
                }
            }
            this.board[this.Nsize / 2 - 1][this.Nsize / 2 - 1] = TURN.WHITE;
            this.board[this.Nsize / 2][this.Nsize / 2] = TURN.WHITE;
            this.board[this.Nsize / 2 - 1][this.Nsize / 2] = TURN.BLACK;
            this.board[this.Nsize / 2][this.Nsize / 2 - 1] = TURN.BLACK;
        }
        put_disc(Imouse) {
            // 合法手か判定したあとに呼ぶ。ひっくり返し、手番を交代する。
            // ひっくり返した石を配列で返す
            var xi = Imouse.xi;
            var yi = Imouse.yi;
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (this.board[_yi][_xi] == 3 - this.turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp & this.board[_yi][_xi] == this.turn) {
                    while ((_xi != xi) || (_yi != yi)) {
                        this.board[_yi][_xi] = this.turn;
                        _xi -= dx; _yi -= dy;
                    }
                    this.board[_yi][_xi] = this.turn;

                }
            }
            this.turn = 3 - this.turn;
        }
        refresh_okeru() {
            this.okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru(xi, yi)) {
                        this.okeru.push([xi, yi]);
                    }
                }
            }
        }
        check_okeru(xi, yi) {
            return this.check_okeru_from(this.board, this.turn, xi, yi);
        }
        in_board(xi, yi) {
            return 0 <= xi & xi < this.Nsize & 0 <= yi & yi < this.Nsize;
        }
        check_okeru_from(board, turn, xi, yi) {
            var flag = false;
            if (board[yi][xi] != TURN.NONE) return false;
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            // var ds = [[1, 0], [-1, 0]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (board[_yi][_xi] == 3 - turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp && board[_yi][_xi] == turn) {
                    return true;
                }
            }
            return false;
        }
        count_colors() {
            var black = 0;
            var white = 0;
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.board[yi][xi] == TURN.BLACK) {
                        black++;
                    } else {
                        if (this.board[yi][xi] == TURN.WHITE) {
                            white++;
                        }
                    }
                }
            }
            return { "BLACK": black, "WHITE": white };
        }
        isover() {
            var ncolors = this.count_colors();
            var nall = ncolors["BLACK"] + ncolors["WHITE"];
            if (nall == this.Nsize * this.Nsize) return true;
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru_from(this.board, TURN.BLACK, xi, yi)) return false;
                    if (this.check_okeru_from(this.board, TURN.WHITE, xi, yi)) return false;

                }
            }
            return true;
        }

        copy_board_from(board) {
            var temp = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                temp[yi] = [];
                for (var xi = 0; xi < this.Nsize; xi++) {
                    temp[yi][xi] = board[yi][xi];
                }
            }
            return temp;
        }		
		isYosumi(te){
			if(te[0] == 0 && te[1] == 0) return true;
			if(te[0] == this.Nsize-1 && te[1] == 0) return true;
			if(te[0] == 0 && te[1] == this.Nsize-1) return true;
			if(te[0] == this.Nsize-1 && te[1] == this.Nsize-1) return true;
			return false;
		}
    }

    class Player {
        constructor() {
            this.ishuman = true;
            this.iscpu = false;
        }
        think() {

        }
    }

    class CPU extends Player {
        constructor(game) {
            super();
            this.ishuman = false;
            this.iscpu = true;
            this.game = game;
        }
        think() {
            //console.log("thinking...");
            return this.think_random();
            //return this.think_minimize_okeru();
        }
        think_random() {
            // 置ける中からランダム
            return this.game.okeru[Math.floor(Math.random() * this.game.okeru.length)];
        }
        think_minimize_okeru() {
            // 敵の置ける場所の数を最小にするような手を選ぶ
            var min_okeru = 10000;
            var min_i = -1;
            for (let i = 0; i < this.game.okeru.length; i++) {
                var te = this.game.okeru[i];
                var co = this.count_okeru_from_te(te[0], te[1]);
                if (co < min_okeru) {
                    min_okeru = co;
                    min_i = i;
                }
            }
            return this.game.okeru[min_i];
        }
        count_okeru_from_te(xi, yi) {
            var bf = new BoardFuture(this.game.board, this.game.turn, this.game.Nsize);
            bf.update_te(xi, yi);
            return bf.count_okeru();
        }
		simulate_from_players(Nsize, board, turn, game, players){
			// Playersを使ってシミュレート。
            game.players.push(players[0]);
            game.players.push(players[1]);
            game.board = game.copy_board_from(board);
            game.turn = turn;
            game.refresh_okeru();
            var finished = false;
            while (!finished) {
                game.refresh_okeru();
                if (game.okeru.length == 0) {
                    // 合法手がないとき。
                    game.turn = 3 - game.turn;
                    game.refresh_okeru();
                    if (game.okeru.length == 0) {
                        // パスが二回続いたとき終了する。
                        finished = true;
                    }
                } else {
                    //合法手があるとき
                    //CPUなら、手を考える。
                    var player = game.players[game.turn - 1];
                    if (player.iscpu) {
                        var te = player.think();
                        game.put_disc({ xi: te[0], yi: te[1] });
                    }
                }
                // 終了してるか？
                if (game.isover()) {
                    finished = true;
                }
            }
            var ncolors = game.count_colors();
            var result = TURN.NONE;
            if (ncolors["BLACK"] > ncolors["WHITE"]) result = TURN.BLACK;
            if (ncolors["BLACK"] < ncolors["WHITE"]) result = TURN.WHITE;
            return result;
		}
		simulate_okeruminimize(Nsize, board, turn){
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPUOkeruMinimize(game));
            players.push(new CPUOkeruMinimize(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
		simulate_okeruRandom(Nsize, board, turn){
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPUOkeruRandom(game));
            players.push(new CPUOkeruRandom(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
        simulate_random(Nsize, board, turn) {
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPU(game));
            players.push(new CPU(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
        }
        simulate(Nsize, board, turn) {
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPU(game));
            players.push(new CPU(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
    }
	class CPUOkeruRandom extends CPU{
		think(){
			var bias = 6; //置けるミニマイズを出しやすくする。
			var randi = Math.floor(Math.random() * this.game.okeru.length) + bias;
			var te_min = this.think_minimize_okeru();
			if(randi >= this.game.okeru.length) return te_min;
			return this.game.okeru[randi];
		}
	}

    class CPUOkeruMinimize extends CPU {
        think() {
            console.log("thinking...");
            return this.think_minimize_okeru();
        }
    }

    class CPUMonteCarlo extends CPU {
        setTrial(n) {
            this.n = n;
        }
        think() {
            var okeru = this.game.okeru;
            var n = this.n || 500; //総試行回数
            var n_each = n / okeru.length;
            var wins = [];
            var maxi = -1;
            for (var i = 0; i < okeru.length; i++) {
                var bf = new BoardFuture(this.game.board, this.game.turn, this.game.Nsize);
                var te = okeru[i];
                bf.update_te(te[0], te[1]);
                var results = [0, 0, 0];
                for (var j = 0; j < n_each; j++) {
                    var result = this.simulate_random(bf.Nsize, bf.board, bf.turn);
                    results[result] += 1;
                }
                wins[i] = results[this.game.turn];
                if (wins[i] > -1) {
                    maxi = i;
                }
                console.log(okeru[i]);
            }

            return okeru[maxi];
        }
    }
	class CPURandomHashi extends CPU{
		think(){
			var n = 4; //四隅は打ちやすくする。
			var myokeru = [];
			for(var i=0; i<this.game.okeru.length; i++){
				if(this.game.isYosumi(this.game.okeru[i])) {
					for(var j=0; j<n; j++){
						myokeru.push(this.game.okeru[i]);
					}	
				}else{
					myokeru.push(this.game.okeru[i]);
				}
			}
            return myokeru[Math.floor(Math.random() * myokeru.length)];
		}
	}
	var BP = [[45, -11, 4, -1, -1, 4, -11, 45],
			  [-11, -16, -1, -3, -3, -1, -16, -11],
			  [4, -1, 2, -1, -1, 2, -1, 4],
			  [-1, -3, -1, 0, 0, -1, -3, -1],
			  [-1, -3, -1, 0, 0, -1, -3, -1],
			  [4, -1, 2, -1, -1, 2, -1, 4],
			  [-11, -16, -1, -3, -3, -1, -16, -11],
			  [45, -11, 4, -1, -1, 4, -11, 45]
			  ];
	class CPUEval extends CPU{
		//塩田（２０１２）の評価関数を用いる
		
		think(){
			var okeru = this.game.okeru;
			var evals = [];
			var maxval = -100000;
			var maxi = 0;
			for(var i=0; i<okeru.length; i++){
				var te = okeru[i];
				//手の場所の価値
				var _bp = 6 * Math.random() * BP[te[1]][te[0]];
				//確定石かどうか
				
				//
				evals.push(_bp);
				if(maxval < _bp){
					maxval = _bp;
					maxi = i;
				}
			}
			return okeru[maxi];
		}
	}

    class CPUMonteCarloTree extends CPU {
        //モンテカルロ木探索を実装した。
		constructor(game, nmax, thres, mythres, C){
			super(game);
			this.nmax = nmax;
			this.thres = thres || 30;
			this.mythres = mythres || 5;
			this.C = C || 0.4;
			this.value_history = [];
			this.has_value_history = true;
		}
        setTrial(n) {
            this.n = n;
        }        
		simulate(Nsize, board, turn) {
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPU(game));
            players.push(new CPU(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
        think() {
            var nmax = this.nmax || 3000;
            var n_total = 0;
            var bf = new BoardFuture(this.game.board, this.game.turn, this.game.Nsize);
            var origin = new Node(null, bf, this.game.turn, this.thres, this.mythres, this.C);
            origin.expand();
            while (n_total < nmax) {
                n_total += 1;

                // nodeを決める。
                //origin.printTree();
                var node = origin.getMaxChild();
                while (!node.isleaf) node = node.getMaxChild();
                //console.log(node);
                var result = this.simulate(this.game.Nsize, node.bf.board, node.bf.turn);
                node.update(result);
            }
            var maxi = origin.getIndexMaxN();
			var maxchild = origin.children[maxi];
			var r = maxchild.results[this.game.turn] / maxchild.n;
			if(r == 0) r = 0.0001;
			if(r == 1) r = 1 - 0.0001;
			this.value_history.push(( -600 * Math.log((1-r) / r)));
			//console.log("");
			for(var i=1000; i<origin.children.length; i++){
				var child = origin.children[i];
				var r = child.results[this.game.turn] / child.n;
				if(maxi == i) console.log(" ===============↓↓↓↓↓↓↓↓=============== ");
				console.log("勝率： " + r + "     win = " + child.results[this.game.turn] + " n = " + child.n);
				if(r == 0) r = 0.0001;
				if(r == 1) r = 1 - 0.0001;
				console.log("評価値: " + ( -600 * Math.log((1-r) / r)));
				
				for(var j=0; j<maxchild.children.length; j++){
					var child = maxchild.children[j];
					var r = child.results[this.game.turn] / child.n;
					console.log("   勝率： " + r + "     win = " + child.results[this.game.turn] + " n = " + child.n);
					if(r == 0) r = 0.0001;
					if(r == 1) r = 1 - 0.0001;
					console.log("   評価値: " + ( -600 * Math.log((1-r) / r)));
				}
				if(maxi == i) console.log(" ===============↑↑↑↑↑↑↑↑=============== ");
			}
            //origin.printAllTree(2);
            return bf.okeru[maxi];
        }
    }

	class CPUMonteCarloTreeHashi extends CPUMonteCarloTree{
		simulate(Nsize, board, turn) {
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPURandomHashi(game));
            players.push(new CPURandomHashi(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
	}
	class CPUMonteCarloEval extends CPUMonteCarloTree{
		simulate(Nsize, board, turn) {
            var game = new Othello(Nsize);
            var players = [];
			players.push(new CPUEval(game));
            players.push(new CPUEval(game));
			return this.simulate_from_players(Nsize, board, turn, game, players);
		}
	}
    class Node {
        constructor(myParent, bf, originturn, thres, mythres, C) {
            this.parent = myParent;
            this.originturn = originturn; // 注： originのturn。
            this.myturn = bf.turn;
            this.children = [];
            this.results = [0, 0, 0];
            this.n = 0;  //そのノードの試行回数
            this.n_total = 0;  //兄弟ノードの試行回数の合計。
            this.thres = thres;
			this.mythres = mythres;
			this.C = C;
            this.bf = bf;
            this.isleaf = true; // expand時にfalseにする
            this.hashi = false;
            if (myParent === null) {
                this.depth = 0;
                this.isorigin = true;
            } else {
                this.depth = this.parent.depth + 1;
				//console.log(this.depth);
                this.isorigin = false;
            }
            this.ucb1 = this.calc_ucb1();
        }
        printTree() {
            var ss = "";
            ss += this.results + " " + this.ucb1 + " maxi = " + this.getIndexMaxUCB1() + "\n";
            for (let child of this.children) {
                ss += child.results + " " + child.ucb1 + " maxi = " + child.getIndexMaxUCB1() + "\n";
            }
            console.log(ss);
        }
        printNode() {
            var ss = "";
            for (var i = 0; i < this.depth + 1; i++) ss += "  ";
            console.log(ss + this.results + " " + this.results[this.originturn] / this.n + " " + this.myturn);
        }
        printAllTree(maxdepth) {
            if (maxdepth < this.depth) return;
            var ss = "";
            for (var i = 0; i < this.depth; i++) ss += "  ";
            console.log(ss + "D=" + this.depth + " " + this.te);
            this.printNode();
            if (!this.hashi) {
                var maxindex = this.getIndexMaxN();
                for (var i = 0; i < this.children.length; i++) {
                    if (this.depth == 0 && i == maxindex) console.log("= = = ↓ selected = = =");
                    this.children[i].printAllTree(maxdepth);
                }
            }
        }
        update(result) {
            this.n += 1;
            this.results[result] += 1;
            this.parent.n_total += 1;
            this.ucb1 = this.calc_ucb1();
            var par = this;
            while (!par.isorigin) {
                par = par.parent;
                par.n += 1;
                par.results[result] += 1;
                par.ucb1 = par.calc_ucb1();
            }
            if (this.n == this.thres && !this.hashi) this.expand();
        }
        calc_ucb1() {
            var n_total;
            if (this.isorigin) {
                n_total = 1;
            } else {
                n_total = this.parent.n_total;
            }
            var win = this.results[3 - this.myturn];　// そのノードでの勝ち。相手は最善を打つ。
            var n = this.n;
            //if(n < 5) return 400000;
			
			var C = this.C;
			
			if(this.bf.count_all_piece() < 40){
				//序盤はまんべんなく読む
				if(n <= this.mythres) return 5;
			}else{
				//終盤は良い手を深く読む
				if(n <= this.mythres) return 5;
			}
			
			
            var ucb1 = win / n + C * Math.sqrt(2 * Math.log(n_total) / this.n);
			//if(this.te != null && this.bf.isYosumi(this.te)) ucb1 += 5;
			return ucb1;
        }
        getMaxChild() {
            var val = -1;
            var maxi = -1;
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (val < child.ucb1) {
                    val = child.ucb1;
                    maxi = i;
                }
            }
            return this.children[maxi];
        }
        getIndexMaxUCB1() {
            var val = -1;
            var maxi = 0;
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
				var ucb1 = child.ucb1;
                if (child.n == 0) {
                    maxi = i;
                    break;
                }
                if (val < ucb1) {
                    val = ucb1;
                    maxi = i;
                }
            }
            return maxi;
        }
        getIndexMaxN() {
            var maxi = -1;
            var maxval = -1;
            for (var i = 0; i < this.children.length; i++) {
				//if(this.bf.isYosumi(this.children[i].te)) return i;
                if (maxval < this.children[i].n) {
                    maxi = i;
                    maxval = this.children[i].n;
                }
            }
            return maxi;
        }
        getIndexMaxWin() {
            var maxi = -1;
            var maxval = -1;
            for (var i = 0; i < this.children.length; i++) {
                if (maxval < this.children[i].n) {
                    maxi = i;
                    maxval = this.children[i].n;
                }
            }
            return maxi;
        }
        expand() {
            if (this.bf.okeru.length == 0) {
                this.bf.turn = 3 - this.bf.turn;
                this.bf.update_okeru();
                if (this.bf.okeru.length == 0) {
                    this.hashi = true;
                    return;
                }
            }
            for (let te of this.bf.okeru) {
                var bf = this.bf.copy();
                bf.put_disc(te[0], te[1]);
                bf.turn = 3 - bf.turn;
                bf.update_okeru();
                var child = new Node(this, bf, this.originturn, this.thres, this.mythres, this.C);
                child.te = te;
                this.children.push(child);
            }
            this.isleaf = false;
        }
    }



    class BoardFuture {
        constructor(board, turn, Nsize) {
            this.future = [];
            this.Nsize = Nsize;
            //this.future.push(this.copy_board_from(board));
            this.board = this.copy_board_from(board);
            this.turn = turn;
            this.update_okeru();
        }
		isYosumi(te){
			if(te[0] == 0 && te[1] == 0) return true;
			if(te[0] == this.Nsize-1 && te[1] == 0) return true;
			if(te[0] == 0 && te[1] == this.Nsize-1) return true;
			if(te[0] == this.Nsize-1 && te[1] == this.Nsize-1) return true;
			return false;
		}
        copy() {
            return new BoardFuture(this.board, this.turn, this.Nsize);
        }
        copy_board_from(board) {
            var temp = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                temp[yi] = [];
                for (var xi = 0; xi < this.Nsize; xi++) {
                    temp[yi][xi] = board[yi][xi];
                }
            }
            return temp;
        }
        update_te(xi, yi) {
            this.put_disc(xi, yi);
            this.turn = 3 - this.turn;
            this.future.push(this.copy_board_from(this.board));
        }
        back() {
            this.future.pop();
            this.board = this.future[this.future.length - 1];
            this.turn = 3 - this.turn;
        }
        put_disc(xi, yi) {
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (this.board[_yi][_xi] == 3 - this.turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp & this.board[_yi][_xi] == this.turn) {
                    while ((_xi != xi) || (_yi != yi)) {
                        this.board[_yi][_xi] = this.turn;
                        _xi -= dx; _yi -= dy;
                    }
                    this.board[_yi][_xi] = this.turn;

                }
            }
        }
        check_okeru(xi, yi) {
            return this.check_okeru_from(this.board, this.turn, xi, yi);
        }
        check_okeru_from(board, turn, xi, yi) {
            var flag = false;
            if (board[yi][xi] != TURN.NONE) return false;
            var ds = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
            // var ds = [[1, 0], [-1, 0]];
            for (let d of ds) {
                var _xi = xi; var _yi = yi;
                var dx = d[0]; var dy = d[1];
                _xi += dx; _yi += dy;
                var flag_temp = false;
                while (this.in_board(_xi, _yi)) {
                    if (board[_yi][_xi] == 3 - turn) {
                        _xi += dx; _yi += dy;
                        flag_temp = true;
                    } else {
                        break;
                    }
                }
                if (!this.in_board(_xi, _yi)) continue;
                if (flag_temp && board[_yi][_xi] == turn) {
                    return true;
                }
            }
            return false;
        }
        in_board(xi, yi) {
            return 0 <= xi & xi < this.Nsize & 0 <= yi & yi < this.Nsize;
        }
        count_okeru() {
            var board = this.board;
            var turn = this.turn;
            var okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru_from(board, turn, xi, yi)) {
                        okeru.push([xi, yi]);
                    }
                }
            }
            return okeru.length;
        }
		count_all_piece(){
			var count = 0;
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.board[yi][xi] != TURN.NONE) {
                        count += 1;
                    }
                }
            }
			return count;
		}
        update_okeru() {
            this.okeru = [];
            for (var yi = 0; yi < this.Nsize; yi++) {
                for (var xi = 0; xi < this.Nsize; xi++) {
                    if (this.check_okeru(xi, yi)) {
                        this.okeru.push([xi, yi]);
                    }
                }
            }
        }

    }
    var maneger = new OthelloController(8, cnvs.width());
    var p_main = cnvs.position();
    var mouse_global = { x: 0, y: 0 };
    var clicked = false;
    cnvs.mousemove((e) => {
        var x = e.pageX - p_main.left;
        var y = e.pageY - p_main.top;
        mouse_global.x = x;
        mouse_global.y = y;
    });
    cnvs.click(() => {
        clicked = true;
    });
    $("#vsHuman").click(() => {
        maneger.start_human();
    });
    $("#vsCPU").click(() => {
		$("#back").show();
		$(".startbtn").hide();
		$(".cpubtn").show();
    });
    $("#vsCPU1").click(() => {
        maneger.start_cpu(1);
    });
    $("#vsCPU2").click(() => {
        maneger.start_cpu(2);
    });
    $("#vsCPU3").click(() => {
        maneger.start_cpu(3);
    });
    $("#vsCPU4").click(() => {
        maneger.start_cpu(4);
    });
    $("#vsCPU5").click(() => {
        maneger.start_cpu(5);
    });
    $("#CPUvsCPU").click(() => {
        maneger.start_cpu(11);
		$("#back").show();
    });
	$("#whatisn").click(() => {
		$("#setsumei").show();
		$(".cpubtn").hide();
	});
	$("#okbtn").click(() => {
		$("#setsumei").hide();
		$(".cpubtn").show();
	});
	$("#again").click( () => {
        maneger.start_cpu(11);
		$("#back").show();
	});
    $("#back").click(() => {
		$("#back").hide();
        $(".simulation").hide();
		$(".cpubtn").hide();
        $(".startbtn").show();
		$("#cnvs").addClass("w3-opacity");
		maneger.gameChu = false;
		maneger.lastte = null;
    });

    function render() {
        maneger.update(mouse_global);
    }
    setInterval(render, 100);

});
