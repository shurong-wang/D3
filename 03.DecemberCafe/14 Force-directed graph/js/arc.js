      // 弧形连线
	  // 制作箭头
      const arrow = svg
      .append('svg:defs')
      .selectAll('marker')
      .data(['warning', 'normal', 'exception', 'active', 'gray'])
      .enter()
      .append('svg:marker')
      .attr({
        id: String,
        viewBox: '0 -5 10 10',
        refX: 26,
        refY: -1.5,
        markerWidth: 6,
        markerHeight: 6,
        orient: 'auto',
      })
      .append('svg:path')
      .attr({
        id: 'linkPath',
        d: 'M0,-5L10,0L0,5',
      });

    // 生成链路容器，并画出链路
    const pathBox = svg
      .append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('g');

    // 文本镜像链路
    const pathClone = pathBox.append('path')
      .attr('class', () => 'link');

    // 真实链路
    const path = pathBox.append('path')
      .attr('class', d => 'link ' + d.status)
      .attr('marker-end', d => 'url(#' + d.status + ')');

    // 生成链路文本容器
    const pathTextBox = svg
      .append('g')
      .selectAll('.linetext')
      .data(links)
      .enter();

    // 生成链路文本背景
    const pathShadow = pathTextBox
      .append('text')
      .attr('dy', 3)
      .attr('text-anhor', 'middle')
      .append('textPath')
      .attr('startOffset', '25%')
      .attr('stroke', '#fff')
      .attr('stroke-width', 5)
      .attr({
        class: 'line-text',
      })
      .text(d => d.path.method);

    // 生成链路文本文字
    const pathText = pathTextBox
      .append('text')
      .attr('dy', 3)
      .attr('text-anhor', 'middle')
      .append('textPath')
      .attr('startOffset', '25%')
      .attr({
        class: 'line-text',
      })
      .text(d => d.path.method);


    // 任何具有相同source与target的链路，都赋予linknum标志来区分彼此，对应不同弧度
    function addLinknum() {
      // 两节点之间如果只有单一链路，赋予赋予linknum标志，值为1
      for (let i = 0; i < links.length; i++) {
        const hasMoreLink = i !== 0 && links[i].source === links[i - 1].source && links[i].target === links[i - 1].target;
        if (!hasMoreLink) {
          links[i].linknum = 1;
        }

        // 判断有相反方向的链路，赋予linknum标志，值为15
        for (let j = 0; j < links.length; j++) {
          const hasTwoDerection = links[i].source === links[j].target && links[i].target === links[j].source && links[j].source === links[i].target && links[j].target === links[i].source;
          if (hasTwoDerection) {
            links[i].linknum = 15;
          }
        }
      }
    }

    // 提取两节点之间的所有直连链路
    function getSiblingLinks(source, target) {
      const siblings = [];
      for (let i = 0; i < links.length; ++i) {
        const isConnect = (links[i].source.name === source.name && links[i].target.name === target.name) || (links[i].source.name === target.name && links[i].target.name === source.name);
        if (isConnect) {
          siblings.push(links[i].path.method);
        }
      }
      return siblings;
    }

    // 定义打点更新函数
    function tick() {
      // 添加弧度标志
      addLinknum();

      // 构造链路的函数
      function arcPath(leftHand, d) {
        const start = leftHand ? d.target : d.source;
        const end = leftHand ? d.source : d.target;
        const dx = end.x - start.x; // 增量
        const dy = end.y - start.y;
        const sweep = leftHand ? 0 : 1;
        const dr = Math.sqrt(dx * dx + dy * dy);
        let drx = dr;
        let dry = dr;
        let curve = 0;
        let homogeneous = 0;

        // 直线链路
        if (d.linknum === 1) {
          curve = 0.1;
          homogeneous = 50;
          drx = dry = Math.sqrt(dx * dx + dy * dy) * (d.linknum + homogeneous) / (curve * homogeneous);
        }

        // 弧形链路
        const siblings = getSiblingLinks(d.source, d.target);
        const siblingCount = siblings.length;
        if (siblingCount > 1) {
          const arcScale = d3.scale.ordinal()
            .domain(siblings)
            .rangePoints([1, siblingCount]);
          let span = 1;
          if (siblingCount > 2) {
            span = 0.8;
          }
          drx = span * drx / (1 + (1 / siblingCount) * (arcScale(d.path.method) - 1));
          dry = span * dry / (1 + (1 / siblingCount) * (arcScale(d.path.method) - 1));
        }
        return 'M' + start.x + ',' + start.y
          + 'A' + drx + ',' + dry
          + ' 0 0,' + sweep + ' ' + end.x + ',' + end.y;
      }

      if (nodes.length > 1) {
        // 更新链路坐标
        path
          .attr('id', d => 'linkPath' + d.target.x + d.source.y + d.path.method)
          .attr('d', d => {
            // 去除无链路关系的单节点的箭头
            if (!d.path.method) {
              return 'M0 0';
            }
            return arcPath(false, d);
          });

        // 更新文本链路坐标
        pathClone
          .attr('id', d => 'textPath' + d.target.x + d.source.y + d.path.method)
          .attr('d', d => arcPath(d.source.x > d.target.x, d));

        // 更新链路文本坐标
        pathText
          .attr('startOffset', '45%')
          .attr('xlink:href', d => '#textPath' + d.target.x + d.source.y + d.path.method);

        // 更新链路文本背景坐标
        pathShadow
          .attr('startOffset', '45%')
          .attr('xlink:href', d => '#textPath' + d.target.x + d.source.y + d.path.method);
      }

      // 更新节点坐标
      node.attr('transform', d => `translate(${d.x},${d.y})`);

      // 更新节点圆环坐标
      nodeCircle.attr('transform', d => `translate(${d.x},${d.y})`);

      // 更新节点标题
      nodeTitle.attr('transform', d => `translate(${d.x},${d.y})`);

      // 更新节点文本
      nodeText.attr('transform', d => `translate(${d.x},${d.y})`);
    }
