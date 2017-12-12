'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var HAP_MAP = 'data/v5.json';
// const HAP_MAP = 'data/v5.simple5.json';

var NODE_INFO = 'data/v5.node-info.simple.json';

var width = Math.max(window.innerWidth - window.innerWidth * 0.15, 800);
var height = window.innerHeight;

var initScale = .7;
var focusNodeId = 8;
var hoverNodeId = 0;

var nodeConf = {
    fillColor: {
        Human: 'rgb(255, 76, 10)',
        Company: 'rgb(35, 148, 206)'
    },
    strokeColor: {
        Human: 'rgb(244,56,0)',
        Company: 'rgb(35, 148, 206)'
    },
    strokeWidth: {
        Human: 3,
        Company: 0
    },
    textFillColor: {
        Human: '#fff',
        Company: '#fff'
    },
    radius: {
        Human: 36,
        Company: 56
    }
};

var lineConf = {
    strokeColor: {
        SERVE: 'rgb(128, 194, 216)',
        OWN: 'rgb(204, 225, 152)',
        INVEST_C: 'rgb(242, 90, 41)'
    }
};

var nodeTextFontSize = 16;
var lineTextFontSize = 12;

var nodesMap = {};
var linkMap = {};

var menuConf = {
    width: 500,
    height: 500,
    offetRadius: 30,
    color: '#00B9C4',
    dataset: [{
        per: 25,
        action: 'info',
        lable: '企业信息',
        url: '#'
    }, {
        per: 25,
        action: 'equity',
        lable: '股权结构',
        url: 'http://www.qq.com/'
    }, {
        per: 25,
        action: 'tree',
        lable: '投资族谱',
        url: 'http://www.sohu.com'
    }, {
        per: 25,
        action: 'relation',
        lable: '企业族谱',
        url: 'http://www.163.com'
    }],
    iconPath: 'menu-icon/',
    iconSize: {
        width: 15,
        height: 15
    }
};
menuConf.innerRadius = nodeConf.radius.Company;
menuConf.outerRadius = menuConf.innerRadius + menuConf.offetRadius;

var initTranslate = [menuConf.outerRadius, menuConf.outerRadius];

// 力导向图
var force = d3.layout.force().size([width, height]) // 画布的大小
.linkDistance(220) // 连线长度
.charge(-3000); // 排斥/吸引，值越小越排斥

// 全图缩放器
var zoom = d3.behavior.zoom().scaleExtent([0.25, 2]).on('zoom', zoomFn);

// 节点拖拽器（使用 d3.behavior.drag 节点拖动失效）
var drag = force.drag().origin(function (d) {
    return d;
}).on('dragstart', dragstartFn).on('drag', dragFn).on('dragend', dragendFn);

// SVG
var svg = d3.select('#graph').append('svg').attr('width', width).attr('height', height).append('g').call(zoom).on('dblclick.zoom', null);

// 缩放层（位置必须在 container 之前）
var zoomOverlay = svg.append('rect').attr('width', width).attr('height', height).style('fill', 'none').style('pointer-events', 'all');

var container = svg.append('g').attr('transform', 'translate(' + initTranslate + ')scale(' + initScale + ')').attr('class', 'container');

// 阴影
var shadow = svg.append('defs').append('filter').attr('id', 'drop-shadow').attr("width", "150%").attr("height", "150%");
shadow.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 3).attr('result', 'blur');
shadow.append('feOffset').attr('in', 'blur').attr('dx', 1).attr('dy', 1).attr('result', 'offsetBlur');

var feMerge = shadow.append('feMerge');
feMerge.append('feMergeNode').attr('in', 'offsetBlur');
feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

// 请求数据，绘制图表
d3.json(HAP_MAP, function (error, resp) {
    if (error) {
        return console.error(error);
    }

    // 初始化
    initialize(resp);
});

// 初始化
function initialize(resp) {
    var nodes = resp.nodes,
        relations = resp.relations;


    var nodesLength = nodes.length;

    // 生成 nodes map
    nodesMap = genNodesMap(nodes);

    // 构建 nodes（不能直接使用请求数据中的 nodes）
    nodes = d3.values(nodesMap);

    // 起点和终点相同的关系映射
    linkMap = genLinkMap(relations);

    // 构建 links（source 属性必须从 0 开始）
    var links = genLinks(relations);

    // 绑定力导向图数据
    force.nodes(nodes) // 设定节点数组
    .links(links); // 设定连线数组

    // 开启力导向布局
    force.start();

    // 手动快速布局
    for (var i = 0, n = 1000; i < n; ++i) {
        force.tick();
    }

    // 停止力布局
    force.stop();

    // 固定所有节点
    nodes.forEach(function (node) {
        node.fixed = true;
    });

    // 箭头
    var marker = container.append('svg:defs').selectAll('marker').data(force.links()).enter().append('svg:marker').attr('id', function (link) {
        return 'marker-' + link.id;
    }).attr('markerUnits', 'userSpaceOnUse').attr('viewBox', '0 -5 10 10').attr('refX', function (link) {
        var nodeType = link.source.ntype;
        if (nodeType === 'Company') {
            return 9;
        }
        if (nodeType === 'Human') {
            if (link.count === 1) {
                return 25;
            } else if (link.count === 2) {} else if (link.count === 3) {
                if (link.index === 1) {
                    return 25;
                }
            } else if (link.count === 4) {
                if (link.index === 1 || link.index === 2) {
                    return 25;
                }
            }
        }
        return 28;
    }).attr('refY', 0).attr('markerWidth', 12).attr('markerHeight', 12).attr('orient', 'auto').attr('stroke-width', 2).append('svg:path').attr('d', 'M2,0 L0,-3 L9,0 L0,3 M2,0 L0,-3').attr('fill', function (link) {
        return lineConf.strokeColor[link.type];
    });

    // 节点连线    
    var linkLine = container.selectAll('.link').data(force.links()).enter().append('path').attr('class', 'link').attr({
        'marker-end': function markerEnd(link) {
            return 'url(#' + 'marker-' + link.id + ')';
        }, // 标记箭头
        'd': function d(link) {
            return genLinkPath(link);
        },
        'id': function id(link) {
            return 'link-' + link.id;
        }
    }).style('stroke', function (link) {
        return lineConf.strokeColor[link.type];
    });

    // 连线的文字
    var lineText = container.append('g').selectAll('.linetext').data(force.links()).enter().append('text').style('font-size', lineTextFontSize).attr({
        'class': 'linetext',
        'id': function id(link) {
            return 'linktext' + link.id;
        },
        'dx': function dx(link) {
            return getLineTextDx(link);
        },
        'dy': 5
    });

    lineText.append('textPath').attr('xlink:href', function (link) {
        return '#link-' + link.id;
    }).text(function (link) {
        return link.label;
    });

    // 节点（圆）
    var nodeCircle = container.append('g').selectAll('.node').data(force.nodes()).enter().append('g').style('cursor', 'pointer').attr('class', 'node').attr('cx', function (node) {
        return node.x;
    }).attr('cy', function (node) {
        return node.y;
    }).call(drag); // 节点可拖动

    nodeCircle.append('circle')
    // .style('fill-opacity', .3) // debug
    .style('fill', function (node) {
        return nodeConf.fillColor[node.ntype];
    }).style('stroke', function (node) {
        return nodeConf.strokeColor[node.ntype];
    }).style('stroke-width', function (node) {
        return nodeConf.strokeWidth[node.ntype];
    }).attr('class', 'node-circle').attr('id', function (node) {
        return 'node-circle-' + node.id;
    }).attr('r', function (node) {
        return nodeConf.radius[node.ntype];
    }).style('filter', 'url(#drop-shadow)');

    // 鼠标交互
    nodeCircle.on('mouseenter', function (currNode) {
        toggleNode(nodeCircle, currNode, true);
        toggleMenu(menuWrapper, currNode, true);
        toggleLine(linkLine, currNode, true);
        toggleMarker(marker, currNode, true);
        toggleLineText(lineText, currNode, true);
    }).on('mouseleave', function (currNode) {
        toggleNode(nodeCircle, currNode, false);
        toggleMenu(menuWrapper, currNode, false);
        toggleLine(linkLine, currNode, false);
        toggleMarker(marker, currNode, false);
        toggleLineText(lineText, currNode, false);
    });

    // 节点文字
    var nodeText = nodeCircle.append('text').attr('class', 'nodetext').attr('id', function (node) {
        return 'node-text-' + node.id;
    }).style('font-size', nodeTextFontSize).style('font-weight', 400).style('fill', function (_ref) {
        var ntype = _ref.ntype;
        return nodeConf.textFillColor[ntype];
    }).attr('text-anchor', 'middle').attr('dy', '.35em').attr('x', function (_ref2) {
        var name = _ref2.name;

        return textBreaking(d3.select(this), name);
    });

    // 节点菜单
    var pie = d3.layout.pie().value(function (d) {
        return d.per;
    });
    var piedata = pie(menuConf.dataset);

    // 聚焦节点
    var focusNode = nodeCircle.filter(function (_ref3) {
        var ntype = _ref3.ntype,
            id = _ref3.id;
        return ntype === 'Company' && id === focusNodeId;
    });

    focusNode.append('circle').attr('r', function (node) {
        return nodeConf.radius[node.ntype] + 8;
    }).style('fill', 'rgba(0,0,0,.0)').style('stroke', 'rgb(0,209,218)').style('stroke-width', 5).style('stroke-dasharray', function (node) {
        return 2 * Math.PI * (nodeConf.radius[node.ntype] + 8) / 8;
    });

    focusNode.append('circle').attr('r', function (node) {
        return nodeConf.radius[node.ntype] + 8;
    }).style('fill', 'rgba(0,0,0,.0)').style('stroke', 'rgb(0,209,218)').style('stroke-width', 5).style('stroke-dasharray', function (node) {
        return 2 * Math.PI * (nodeConf.radius[node.ntype] + 8) / 8;
    }).style('stroke-dashoffset', -45);

    // 环形菜单
    var menuWrapper = nodeCircle.filter(function (_ref4) {
        var ntype = _ref4.ntype;
        return ntype === 'Company';
    }).append('g').attr('id', function (node) {
        return 'menu-wrapper-' + node.id;
    }).style('display', 'none');

    var wheelMenu = menuWrapper.selectAll('.wheel-menu').data(piedata).enter().append('g').on('click', function (d, i) {
        if (d.data.action === 'info') {
            toggleMask(true);
            toggleNodeInfo(false, null);
            d3.json(NODE_INFO, function (error, resp) {
                if (error) {
                    toggleMask(false);
                    return console.error(error);
                }
                setTimeout(function () {
                    toggleMask(false);
                    toggleNodeInfo(true, resp);
                }, 1000);
            });
            return;
        }
        location = d.data.url + '?id=' + hoverNodeId;
    });

    var menuArc = d3.svg.arc().innerRadius(menuConf.innerRadius).outerRadius(menuConf.outerRadius);

    wheelMenu.append('path').attr('fill', menuConf.color).attr('stroke', '#fff').attr('stroke-width', 1).attr('d', function (d) {
        return menuArc(d);
    });

    wheelMenu.append('image').attr('width', menuConf.iconSize.width).attr('height', menuConf.iconSize.height).attr('x', -(menuConf.iconSize.width / 2)).attr('y', -(menuConf.iconSize.width / 2)).attr('transform', function (d) {
        return 'translate(' + menuArc.centroid(d) + ')';
    }).attr('xlink:href', function (d, i) {
        return menuConf.iconPath + d.data.action + '.png';
    });

    // 更新力导向图
    function tick() {
        // 节点位置
        nodeCircle.attr('transform', function (node) {
            return 'translate(' + node.x + ',' + node.y + ')';
        });
        // 连线路径
        linkLine.attr('d', function (link) {
            return genLinkPath(link);
        });
        // 连线文字位置
        lineText.attr('dx', function (link) {
            return getLineTextDx(link);
        });
        // 连线文字角度 
        lineText.attr('transform', function (link) {
            return getLineTextAngle(link, this.getBBox());
        });
    }

    // 更新力导向图
    // 注意1：必须调用一次 tick （否则，节点会堆积在左上角）
    // 注意2：调用位置必须在 nodeCircle, nodeText, linkLine, lineText 后
    tick();

    // 监听力学图运动事件，更新坐标
    force.on('tick', tick);
}

function genLinks(relations) {
    var indexHash = {};

    return relations.map(function (_ref5, i) {
        var id = _ref5.id,
            startNode = _ref5.startNode,
            endNode = _ref5.endNode,
            label = _ref5.label,
            type = _ref5.type;

        var linkKey = startNode + '-' + endNode;
        if (indexHash[linkKey]) {
            indexHash[linkKey] -= 1;
        } else {
            indexHash[linkKey] = linkMap[linkKey] - 1;
        }

        return {
            id: id,
            source: nodesMap[startNode],
            target: nodesMap[endNode],
            label: label,
            type: type,
            count: linkMap[linkKey],
            index: indexHash[linkKey]
        };
    });
}

function genLinkMap(relations) {
    var hash = {};
    relations.map(function (_ref6) {
        var startNode = _ref6.startNode,
            endNode = _ref6.endNode,
            label = _ref6.label;

        var key = startNode + '-' + endNode;
        hash[key] = hash[key] ? hash[key] + 1 : 1;
    });
    return hash;
}

function genNodesMap(nodes) {
    var hash = {};
    nodes.map(function (_ref7) {
        var id = _ref7.id,
            name = _ref7.name,
            ntype = _ref7.ntype;

        hash[id] = {
            id: id,
            name: name,
            ntype: ntype
        };
    });
    return hash;
}

// 生成关系连线路径
function genLinkPath(link) {

    var count = link.count;
    var index = link.index;
    var r = nodeConf.radius[link.source.ntype];

    var sx = link.source.x;
    var sy = link.source.y;
    var tx = link.target.x;
    var ty = link.target.y;

    var _getParallelLine = getParallelLine(count, index, r, sx, sy, tx, ty),
        parallelSx = _getParallelLine.parallelSx,
        parallelSy = _getParallelLine.parallelSy,
        parallelTx = _getParallelLine.parallelTx,
        parallelTy = _getParallelLine.parallelTy;

    return 'M' + parallelSx + ',' + parallelSy + ' L' + parallelTx + ',' + parallelTy;
}

function getLineAngle(sx, sy, tx, ty) {
    // 两点 x, y 坐标偏移值
    var x = tx - sx;
    var y = ty - sy;
    // 斜边长度
    var hypotenuse = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    // 求出弧度
    var cos = x / hypotenuse;
    var radian = Math.acos(cos);
    // 用弧度算出角度   
    var angle = 180 / (Math.PI / radian);
    if (y < 0) {
        angle = -angle;
    } else if (y == 0 && x < 0) {
        angle = 180;
    }
    return angle;
}

function zoomFn() {
    var _d3$event = d3.event,
        translate = _d3$event.translate,
        scale = _d3$event.scale;

    var _translate = _slicedToArray(translate, 2),
        x = _translate[0],
        y = _translate[1];

    var dx = initTranslate[0],
        dy = initTranslate[1];

    var zoomTranslate = [x + dx, y + dy];

    container.attr('transform', 'translate(' + zoomTranslate + ')scale(' + scale * initScale + ')');
}

function dragstartFn(d) {
    d3.event.sourceEvent.stopPropagation();
    force.start();
}

function dragFn(d) {
    d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
}

function dragendFn(d) {
    force.stop();
}

function isLinkLine(node, link) {
    return link.source.id == node.id || link.target.id == node.id;
}

function isLinkNode(currNode, node) {
    if (currNode.id === node.id) {
        return true;
    }
    return linkMap[currNode.id + '-' + node.id] || linkMap[node.id + '-' + currNode.id];
}

function textBreaking(d3text, text) {
    var len = text.length;
    if (len <= 4) {
        d3text.append('tspan').attr('x', 0).attr('y', 2).text(text);
    } else {
        var topText = text.substring(0, 4);
        var midText = text.substring(4, 9);
        var botText = text.substring(9, len);
        var topY = -22;
        var midY = 8;
        var botY = 34;
        if (len <= 10) {
            topY += 10;
            midY += 10;
        } else {
            botText = text.substring(9, 11) + '...';
        }

        d3text.text('');
        d3text.append('tspan').attr('x', 0).attr('y', topY).text(function () {
            return topText;
        });
        d3text.append('tspan').attr('x', 0).attr('y', midY).text(function () {
            return midText;
        });
        d3text.append('tspan').attr('x', 0).attr('y', botY).text(function () {
            return botText;
        });
    }
}

function getLineTextDx(d) {
    var sx = d.source.x;
    var sy = d.source.y;
    var tx = d.target.x;
    var ty = d.target.y;

    var distance = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
    var textLength = d.label.length;
    var sr = nodeConf.radius[d.source.ntype];
    var tr = nodeConf.radius[d.target.ntype];

    var dx = (distance - sr - tr - textLength * lineTextFontSize) / 2;

    return dx;
}

function getLineTextAngle(d, bbox) {
    if (d.target.x < d.source.x) {
        var x = bbox.x,
            y = bbox.y,
            _width = bbox.width,
            _height = bbox.height;

        var rx = x + _width / 2;
        var ry = y + _height / 2;
        return 'rotate(180 ' + rx + ' ' + ry + ')';
    } else {
        return 'rotate(0)';
    }
}

function toggleNode(nodeCircle, currNode, isHover) {
    if (isHover) {
        // 提升节点层级 
        nodeCircle.sort(function (a, b) {
            return a.id === currNode.id ? 1 : -1;
        });
        // this.parentNode.appendChild(this);
        nodeCircle.style('opacity', .1).filter(function (node) {
            return isLinkNode(currNode, node);
        }).style('opacity', 1);
    } else {
        nodeCircle.style('opacity', 1);
    }
}

function toggleMenu(menuWrapper, currNode, isHover) {
    if (isHover) {
        hoverNodeId = currNode.id;
        // 显示节点菜单
        menuWrapper.filter(function (node) {
            return node.id === currNode.id;
        }).style('display', 'block');
    } else {
        hoverNodeId = 0;
        // 隐藏节点菜单
        menuWrapper.filter(function (node) {
            return node.id === currNode.id;
        }).style('display', 'none');
    }
}

function toggleLine(linkLine, currNode, isHover) {
    if (isHover) {
        // 加重连线样式
        linkLine.style('opacity', .1).filter(function (link) {
            return isLinkLine(currNode, link);
        }).style('opacity', 1).classed('link-active', true);
    } else {
        // 连线恢复样式
        linkLine.style('opacity', 1).classed('link-active', false);
    }
}

function toggleLineText(lineText, currNode, isHover) {
    if (isHover) {
        // 只显示相连连线文字
        lineText.style('fill-opacity', function (link) {
            return isLinkLine(currNode, link) ? 1.0 : 0.0;
        });
    } else {
        // 显示所有连线文字
        lineText.style('fill-opacity', '1.0');
    }
}

function toggleMarker(marker, currNode, isHover) {
    if (isHover) {
        // 放大箭头
        marker.filter(function (link) {
            return isLinkLine(currNode, link);
        }).style('transform', 'scale(1.5)');
    } else {
        // 恢复箭头
        marker.attr('refX', nodeConf.radius.Company).style('transform', 'scale(1)');
    }
}

function round(index) {
    var pow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

    var multiple = Math.pow(10, pow);
    return Math.round(index * multiple) / multiple;
}

// 设置平行线坐标
function getParallelLine(count, index, r, sx, sy, tx, ty) {

    // 把圆理解为一个盒子，平行线是装在盒子里
    // offet 控制内边距，取值范围是 -r/2 到 r/2
    var offet = -6;

    var dx = tx - sx;
    var dy = ty - sy;
    var hypotenuse = Math.sqrt(dx * dx + dy * dy);
    var angle = 180 * Math.asin(dx / hypotenuse) / Math.PI;

    var a = Math.cos(angle * Math.PI / 180) * r;
    var b = Math.sin(angle * Math.PI / 180) * r;

    var sourceX = sx + b;
    var targetX = tx - b;
    var sourceY = dy < 0 ? sy - a : sy + a;
    var targetY = dy < 0 ? ty + a : ty - a;

    var maxCount = 4; // 最大连线数
    var minStart = count === 1 ? 0 : -r / 2 + offet;
    var start = minStart * (count / maxCount); // 连线线开始位置
    var space = count === 1 ? 0 : Math.abs(minStart * 2 / (maxCount - 1)); // 连线间隔
    var position = start + space * index; // 位置分布
    var isY = dy < 0;

    if (position > r) {
        return {
            parallelSx: sx,
            parallelSy: sy,
            parallelTx: tx,
            parallelTy: ty
        };
    } else {
        var s = r - Math.sin(180 * Math.acos(position / r) / Math.PI * Math.PI / 180) * r;
        var _a = Math.cos(angle * Math.PI / 180);
        var _b = Math.sin(angle * Math.PI / 180);
        var _a2 = _a * position;
        var _b2 = _b * position;
        var rx = _b * s;
        var ry = _a * s;

        return {
            parallelSx: (isY ? sourceX + _a2 : sourceX - _a2) - rx,
            parallelSy: (isY ? sourceY + ry : sourceY - ry) + _b2,
            parallelTx: (isY ? targetX + _a2 : targetX - _a2) + rx,
            parallelTy: (isY ? targetY - ry : targetY + ry) + _b2
        };
    }
}

function toggleNodeInfo(flag, data) {

    var nodeInfoWarp = document.querySelector('.node-info-warp');

    if (flag && data) {
        if (!nodeInfoWarp) {
            var graph = document.querySelector('#graph');
            nodeInfoWarp = document.createElement('div');
            nodeInfoWarp.setAttribute('class', 'node-info-warp');
            graph.appendChild(nodeInfoWarp);
        }

        var id = data.id,
            name = data.name,
            regStatus = data.regStatus,
            legalPersonName = data.legalPersonName,
            companyOrgType = data.companyOrgType,
            regCapital = data.regCapital,
            estiblishTime = data.estiblishTime,
            regLocation = data.regLocation;


        var html = '\n            <div class="company-title">\n                <span class="close-info">\xD7</span>\n                <span class="company-name">' + name + '</span>\n                <span class="company-reg-status">' + regStatus + '</span>\n            </div>\n            <div class="node-title-split"></div>\n            <div class="company-info">\n                <div>\u6CD5\u4EBA\uFF1A' + legalPersonName + '</div>\n                <div>\u4F01\u4E1A\u7C7B\u578B\uFF1A' + companyOrgType + '</div>\n                <div>\u6CE8\u518C\u8D44\u672C\uFF1A' + regCapital + '</div>\n                <div>\u6210\u7ACB\u65E5\u671F\uFF1A' + formatDate(estiblishTime) + '</div>\n                <div>\u6CE8\u518C\u5730\u5740\uFF1A' + regLocation + '</div>\n            </div>\n        ';
        nodeInfoWarp.innerHTML = html;
        document.querySelector('.close-info').addEventListener('click', function () {
            toggleNodeInfo(false, null);
        });
        nodeInfoWarp.style.cssText = 'display: block';
    } else {
        if (nodeInfoWarp) {
            nodeInfoWarp.innerHTML = '';
            nodeInfoWarp.style.cssText = 'display: none';
        }
    }
}

function toggleMask(flag) {
    var loadingMask = document.querySelector('#loading-mask');

    if (flag) {
        if (!loadingMask) {
            var graph = document.querySelector('#graph');
            loadingMask = document.createElement('div');
            loadingMask.setAttribute('id', 'loading-mask');
            graph.appendChild(loadingMask);
        }
        var html = '\n            <div class="loader">\n                <div class="ball-spin-fade-loader">\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                    <div></div>\n                </div>\n            </div>\n        ';
        loadingMask.innerHTML = html;
        loadingMask.style.cssText = 'display: flex';
    } else {
        if (loadingMask) {
            loadingMask.innerHTML = '';
            loadingMask.style.cssText = 'display: none';
        }
    }
}

function formatDate(timestamp) {
    var date = new Date(+timestamp);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    var d = date.getDate();
    d = d < 10 ? '0' + d : d;
    return y + '-' + m + '-' + d;
}