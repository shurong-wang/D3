import svg2png from "save-svg-as-png"; //引入svg转png模块
export default function () {
	d3.select("#J_ExportPng").on("click", function () {
		if ($("#J_SvgView").size()) {
			const $all = $(".all");
			const $graphArea = $('.graph-area');
			const transform = $all.attr("transform");
			const scale = (transform && /scale/.test(transform)) ? (+ transform.match(/scale\(([^\)]+)\)/)[1]) : 1;
			const allPos = $all[0].getBoundingClientRect();
			const left = allPos.left - $graphArea.offset().left - 15 * scale;
			const top = allPos.top - $graphArea.offset().top;
			const width = allPos.width + 30 * scale;
			const height = allPos.height;
			svg2png.saveSvgAsPng($("#J_SvgView")[0], `图片预览${+new Date()}.png`, { left, top, width, height })
		}
	});
}