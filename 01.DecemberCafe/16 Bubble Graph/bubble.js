(function (window, d3) {
    var stoneChartBubble = window.stoneChartBubble = function (id) {

        this.svg = d3.select('#' + id),
            this.width = +this.svg.attr("width"),
            this.height = +this.svg.attr("height");

        this.format = d3.format(",d");

        this.color = d3.scaleOrdinal(d3.schemeCategory20c);

        this.pack = d3.pack()
            .size([this.width, this.height])
            .padding(1.5);

        this.columns = ['name', 'value'];
    }

    stoneChartBubble.prototype.load = function (options) {
        var clumnMouseover = function (d) {
            if (!d.tipShow) return;
            d3.select(this).selectAll(".transparentPath").attr("opacity", 0.8);
            // 添加 div
            tipTimerConfig.target = this;
            tipTimerConfig.longer = new Date().getTime();
            tipTimerConfig.exist = false;
            //获取坐标
            tipTimerConfig.winEvent = {
                x: event.clientX - 100,
                y: event.clientY
            };
            tipTimerConfig.boxHeight = 50;
            tipTimerConfig.boxWidth = 140;

            //hide
            tipTimerConfig.ClearDiv();
            //show
            var tipHTML;
            if (that.options.tipFormat) {
                tipHTML = that.options.tipFormat(d.data);
            } else {
                tipHTML = createTooltipTableData(d)
            }
            tipTimerConfig.hoverTimerFn(tipHTML);
        };
        var clumnMouseout = function (d) {
            if (!d.tipShow) return;
            d3.select(this).selectAll(".transparentPath").attr("opacity", 1);
            tipTimerConfig.target = null;
            tipTimerConfig.ClearDiv();
        };

        var randomNum = Math.random().toFixed(5) * 100000;

        var data = options.data
        this.options = options;
        var that = this;
        data.columns = this.columns;
        var list = d3.hierarchy({
            children: data
        })
            .sum(function (d) {
                return d.value;
            })
            .each(function (d, i) {
                d.name = d.data.name;
                d.color = d.data.color;
                d.tipShow = d.data.tipShow;
            });

        var mj = this.width * this.height;
        var PI = Math.PI;
        var l = [];
        var sum = 0;
        var space = 0.35;
        if (data.length < 10) space = 0.5;
        if (data.length >= 10 && data.length < 100) space = 0.4;

        var node = this.svg.selectAll(".node")
            .data(this.pack(list).leaves())
            .enter().append("g")
            .attr("class", "node")
            .each(function (d) {
                d.r *= 4;
                l.push(d.r);
            })

        l.forEach(function (d) {
            sum += d * d * PI;
        })
        var f1 = true;
        var m = Math.min(that.width, that.height) / 2;
        for (var i in l) {
            if (l[i] > m) {
                f1 = true;
                break;
            }
        }
        while (f1) {
            l = l.map(function (d) {
                return d *= 0.99;
            })
            f1 = false;
            for (var i in l) {
                if (l[i] > m) {
                    f1 = true;
                    break;
                }
            }
        }

        var flag = sum > (mj - mj * space);
        while (flag) {
            sum = 0;
            l = l.map(function (d) {
                return d *= 0.99;
            })
            l.forEach(function (d) {
                sum += d * d * PI;
            })
            flag = sum > (mj - mj * space);
        }
        node.each(function (d, i) {
            d.r = l[i];
        })


        var simulation = d3.forceSimulation(list.children)
            .velocityDecay(0.15)
            .force("x", d3.forceX().strength(0.0005))
            .force("y", d3.forceY().strength(0.0005))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collide", d3.forceCollide().radius(function (d) {
                return d.r + 3;
            }))
            .on("tick", function ticked() {
                node.attr("transform", function (d) {
                    // 限制节点不超出显示范围
                    if (d.x - d.r < 0) d.x = d.r + 0;
                    if (d.y - d.r < 0) d.y = d.r + 0;
                    if (d.x + d.r > that.width) d.x = that.width - d.r - 0;
                    if (d.y + d.r > that.height) d.y = that.height - d.r - 0;
                    return "translate(" + d.x + "," + d.y + ")";
                })
            });

        node.each(function (d, i) {
            d.textStyle = d.name + '_' + i + randomNum;
            d = d.data;
            if (!d.radialGradient || d.radialGradient.length < 2) return;
            d.radialGradientName = 'radialGradient_' + i + randomNum;
            var t = d3.select(this);
            var defs = t.append('defs');

            var r = defs.append('radialGradient')
                .attr('id', d.radialGradientName)
                .attr('cx', '50%')
                .attr('cy', '50%')
                .attr('r', '50%')
                .attr('fx', '50%')
                .attr('fy', '50%');
            r.append('stop')
            .attr('offset', '0%')
            .style('stop-opacity', '0')
            .style('stop-color', d.radialGradient[0]);

            var m = 1 / d.radialGradient.length - 1;
            for (var i = 1; i < d.radialGradient.length - 1; i++) {
                r.append('stop')
                    .attr('offset', i * m * 100 + '%')
                    .style('stop-opacity', i * m)
                    .style('stop-color', d.radialGradient[i]);
            }
            r.append('stop')
                .attr('offset', '100%')
                .style('stop-opacity', '1')
                .style('stop-color', d.radialGradient[d.radialGradient.length - 1]);
            // t.style('fill', 'url(#'+d.radialGradientName+')')
        })
            .on("mouseover", clumnMouseover)
            .on("mouseout", clumnMouseout);

        node.append("circle")
            .attr("id", function (d) {
                return d.textStyle;
            })
            .attr("r", function (d) {
                return d.r;
            })
            .style("fill", function (d) {
                return d.color || that.color(d.name);
            });
        node.append('circle')
            .attr("r", function (d) {
                return d.r
            })
            .style("fill", function (d) {
                return 'url(#' + d.data.radialGradientName + ')'
            })

        node.append("clipPath")
            .attr("id", function (d, i) {
                return "clip-" + d.textStyle;
            })
            .append("use")
            .attr("xlink:href", function (d, i) {
                return "#" + d.textStyle;
            });

        node.append("text")
            .attr("clip-path", function (d, i) {
                return "url(#clip-" + d.textStyle + ")";
            })
            .selectAll("tspan")
            .data(function (d) {
                return d.name.split(/(?=[A-Z][^A-Z])/g);
            })
            .enter().append("tspan")
            .attr("x", 0)
            .attr("y", function (d, i, nodes) {
                return 13 + (i - nodes.length / 2 - 0.5) * 10;
            })
            .text(function (d) {
                return d;
            });

    }
    stoneChartBubble.prototype.destroy = function () {
        this.svg.remove();
    }

    var createTooltipTableData = function (info) {
        var ary = [];
        ary.push("<div class='tip-hill-div'>");
        ary.push("<h1>" + info.name + "</h1>");
        ary.push("</div>");
        return ary.join("");
    };

    var tipTimerConfig = {
        longer: 0,
        target: null,
        exist: false,
        winEvent: window.event,
        boxHeight: 398,
        boxWidth: 376,
        maxWidth: 376,
        maxHeight: 398,
        tooltip: null,

        showTime: 3500,
        hoverTime: 0,
        displayText: "",
        show: function (val, e) {
            "use strict";
            var me = this;

            if (e != null) {
                me.winEvent = e;
            }

            me.displayText = val;

            me.calculateBoxAndShow();

            me.createTimer();
        },
        calculateBoxAndShow: function () {
            "use strict";
            var me = this;
            var _x = 0;
            var _y = 0;
            var _w = document.documentElement.scrollWidth;
            var _h = document.documentElement.scrollHeight;
            var wScrollX = window.scrollX || document.body.scrollLeft;
            var wScrollY = window.scrollY || document.body.scrollTop;
            var xMouse = me.winEvent.x + wScrollX;
            if (_w - xMouse < me.boxWidth) {
                _x = xMouse - me.boxWidth - 10;
            } else {
                _x = xMouse;
            }

            var _yMouse = me.winEvent.y + wScrollY;
            if (_h - _yMouse < me.boxHeight + 18) {
                _y = _yMouse - me.boxHeight - 25;
            } else {

                _y = _yMouse + 18;
            }

            me.addTooltip(_x, _y);
        },
        addTooltip: function (page_x, page_y) {
            "use strict";
            var me = this;

            me.tooltip = document.createElement("div");
            me.tooltip.style.left = page_x + "px";
            me.tooltip.style.top = page_y + "px";
            me.tooltip.style.position = "absolute";

            me.tooltip.style.width = me.boxWidth + "px";
            me.tooltip.style.height = me.boxHeight + "px";
            me.tooltip.className = "three-tooltip";

            var divInnerHeader = me.createInner();
            divInnerHeader.innerHTML = me.displayText;
            me.tooltip.appendChild(divInnerHeader);

            document.body.appendChild(me.tooltip);
        },
        createInner: function () {
            "use strict";
            var me = this;
            var divInnerHeader = document.createElement('div');
            divInnerHeader.style.width = me.boxWidth + "px";
            divInnerHeader.style.height = me.boxHeight + "px";
            return divInnerHeader;
        },
        ClearDiv: function () {
            "use strict";
            var delDiv = document.body.getElementsByClassName("three-tooltip");
            for (var i = delDiv.length - 1; i >= 0; i--) {
                document.body.removeChild(delDiv[i]);
            }
        },
        createTimer: function (delTarget) {
            "use strict";
            var me = this;
            var delTip = me.tooltip;
            var delTarget = tipTimerConfig.target;
            var removeTimer = window.setTimeout(function () {
                try {
                    if (delTip != null) {
                        document.body.removeChild(delTip);
                        if (tipTimerConfig.target == delTarget) {
                            me.exist = false;
                        }
                    }
                    clearTimeout(removeTimer);
                } catch (e) {
                    clearTimeout(removeTimer);
                }
            }, me.showTime);
        },
        hoverTimerFn: function (showTip, showTarget) {
            "use strict";
            var me = this;

            var showTarget = tipTimerConfig.target;

            var hoverTimer = window.setInterval(function () {
                try {
                    if (tipTimerConfig.target != showTarget) {
                        clearInterval(hoverTimer);
                    } else if (!tipTimerConfig.exist && (new Date()).getTime() - me.longer > me.hoverTime) {
                        //show
                        tipTimerConfig.show(showTip);
                        tipTimerConfig.exist = true;
                        clearInterval(hoverTimer);
                    }
                } catch (e) {
                    clearInterval(hoverTimer);
                }
            }, tipTimerConfig.hoverTime);
        }
    };

})(window, d3);
