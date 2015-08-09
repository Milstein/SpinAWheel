//------------------------------------------------------------------------------------------------
//  
//  PrizeWheelGame
//  
//------------------------------------------------------------------------------------------------
function PrizeWheelGame (params) {

	//------------------------------------
	//  Config Object
	//------------------------------------
	var config = {
		height: 402,
		width: 402,
		id: "iw_game_container",
		wheelImage: "wheel2.png",
		numSpins: 10,
		spinDuration: 6,
		uuid: "",
		loseRotations: [60, 240],
		winRotations: [0, 120, 180, 300],
		endRotation: undefined,
		startRotation: 0,
		spinDirection: "cw"
	},
	//------------------------------------
	//  Static Variables
	//------------------------------------
		isCanvasSupported,
		isVMLSupported,
		canvasObject,
		ctx,
		keypoints = [],
		curveFormula,
		startFormula,
		wheel,
		gameOver = false,
		easeInMultiplier = 0.125,
		easeInDuration,
		startTime,
		wheelRotation = 0,
		endRotation = 0,
		imageHasBeenDrawn = false,
		inky,
		thisGame = this;


	//------------------------------------
	//  Public Methods
	//------------------------------------
	this.isWin = function () {
		return inky;
	}


	//------------------------------------
	//  Button Visibilities
	//------------------------------------
	this.setButtons = function (state) {
		$("#iw_game_start_btn").hide();
		$("#iw_game_next_btn").hide();
		$("#iw_game_start_btn").unbind();
		if (state === "start") {
			$("#iw_game_start_btn").show();
			$("#iw_game_start_btn").bind("click", function () {
				onStartClick();
			});
		} else if (state === "end") {
			$("#iw_game_next_btn").show();
			// No need to bind. Next button determined via <a> tag href.
		}
	}


	//------------------------------------
	//  Setup
	//------------------------------------
	function setupSpinner () {

		// Set up end rotation, if not specified in config, by picking random rotation from win/lose array. 
		// Add to this value the number of (spin rotations * 360) for final endRotation value.
		//if (config.endRotation !== "undefined") {
		//	if (inky) {
		//		config.endRotation = config.winRotations[Math.floor(Math.random() * config.winRotations.length)];
		//	} else {
		//		config.endRotation = config.loseRotations[Math.floor(Math.random() * config.loseRotations.length)];
		//	}
		//}
		//config.endRotation += (config.numSpins * 360);

		// Make sure spinDirection is a valid value. Default to "cw" if value is NOT "ccw".
		if (config.spinDirection.toLowerCase() !== "ccw") {
			config.spinDirection = "cw";
		}
		
		// Assign keypoints and get parabola for retrieving rotations from time.
		// X axis = time, Y axis = rotation.
		// We will only use first half of parabola, thus middle point is at x/y spinDuration, endRotation.
		// If CCW direction, make endRotation negative to animate in reverse direction.
		keypoints = [];
		keypoints[0] = new Point(0, config.startRotation);
		keypoints[1] = new Point(config.spinDuration, config.endRotation);
		keypoints[2] = new Point(config.spinDuration * 2, config.startRotation);
		if (config.spinDirection === "ccw") {
			keypoints[1].y *= -1;
		}
		curveFormula = new MultiCurveFormula(keypoints);

		// Get rotation (Y) value at the "easeInDuration" X value. This is used to get startFormula points.
		easeInDuration = config.spinDuration * easeInMultiplier;
		var temp = curveFormula.getValue(easeInDuration);

		// Assign keypoints and get parabola for startFormula.
		// We only use last half of parabola, thus middle point is at 0, 0.
		keypoints = [];
		keypoints[0] = new Point((-1) * easeInDuration, temp);
		keypoints[1] = new Point(0, config.startRotation);
		keypoints[2] = new Point(easeInDuration, temp);
		startFormula = new MultiCurveFormula(keypoints);

	}


	//------------------------------------
	//  Asset Loading
	//------------------------------------
	function loadAssets () {
		if (!isCanvasSupported && !isVMLSupported) {
			$("#" + config.id).trigger("incompatible");
			return;
		}
		wheel = new Image();
		wheel.onload = function () {
			drawRotatedImage(wheel, config.width/2, config.height/2, config.startRotation);
			$(canvasObject).show();
			thisGame.setButtons("start");
			$("#" + config.id).trigger("created");
		}
		wheel.onerror = function () {
			throw new Error("Error loading iamge: " + config.wheelImage);
		}
		wheel.src = config.wheelImage;
	}


	//------------------------------------
	//  Animation & Frame Rendering
	//------------------------------------
	function animLoop () {
		if (!gameOver) {
			onEnterFrame(animLoop);
			render();
		}
	}
	function render () {

		var nowTime = $.now();
		var deltaTime = (nowTime - startTime) / 1000;
		var newRotation;
		
		// If elapsed time is w/in easeInDuration, use startFormula to get value, otherwise use curveFormula.
		if (deltaTime < easeInDuration) {
			newRotation = startFormula.getValue(deltaTime);
		} else {
			newRotation = curveFormula.getValue(deltaTime);
		}

		// If at or after end time, snap to end rotation.
		if (deltaTime >= config.spinDuration) {
			newRotation = config.endRotation ;
			gameOver = true;
			$("#" + config.id).trigger("complete");
			thisGame.setButtons("end");
		}

		// Set wheelRotation to newRotation.
		wheelRotation = newRotation;

		// Draw rotated image.
		ctx.clearRect(0, 0, config.width, config.height);
		drawRotatedImage(wheel, config.width/2, config.height/2, wheelRotation);

	}


	//------------------------------------
	//  Spinner Drawing
	//------------------------------------
	function drawRotatedImage (image, x, y, angle) {
	
		// Save current coordinates
		ctx.save();
		
		// Move to target coordinates (middle of image)
		ctx.translate(x, y);
	
		// Rotate, converting from degrees to radians
		ctx.rotate(angle * (Math.PI / 180));
	
		// Draw image up and to the left by half the width and height
		ctx.drawImage(image, -(image.width/2), -(image.height/2));
	
		// Laslty, restore the coordinates
		ctx.restore();
	}


	//------------------------------------
	//  Button Handlers
	//------------------------------------
	function onStartClick () {
		$("#" + config.id).trigger("start");
		thisGame.start();
	}
	this.start = function () {
		thisGame.setButtons();
		startTime = $.now();
		animLoop();
	}


	//------------------------------------
	//  Capability Methods
	//------------------------------------
	function checkCanvasSupport () {
		var elem = document.createElement('canvas');
		return !!(elem.getContext && elem.getContext('2d'));
	}
	function checkVMLSupport () {
		if (typeof checkVMLSupport.supported === "undefined") {
			var a = document.body.appendChild(document.createElement('div'));
			a.innerHTML = '<v:shape id="vml_flag1" adj="1" />';
			var b = a.firstChild;
			b.style.behavior = "url(#default#VML)";
			checkVMLSupport.supported = b ? typeof b.adj === "object" : true;
			a.parentNode.removeChild(a);
		}
		return checkVMLSupport.supported;
	}


	//------------------------------------
	//  Initialization (Self-Executing)
	//------------------------------------
	(function () {

		// Set capabilities variables
		isCanvasSupported = checkCanvasSupport();
		isVMLSupported = checkVMLSupport();

		// Set config variables based on params passed into game
		for (var attr in params) {
			var obj = params[attr];
			if (config.hasOwnProperty(attr)) {
				config[attr] = obj;
			}
		}

		// Hide buttons by default
		thisGame.setButtons();

		// Set result
		inky = (config.uuid !== "undefined" && config.uuid !== "") ? true : false;

		// Create canvas
		canvasObject = document.createElement("canvas");
		canvasObject.setAttribute("width", config.width);
		canvasObject.setAttribute("height", config.height);
		canvasObject.setAttribute("id", "iw_game_canvas");
		document.getElementById(config.id).appendChild(canvasObject);
		if (!isCanvasSupported) {
			if (typeof G_vmlCanvasManager !== "undefined") {
				G_vmlCanvasManager.initElement(canvasObject);
			}
		}
		ctx = canvasObject.getContext("2d");
		$(canvasObject).hide();

		// Continue setup.
		setupSpinner();
		loadAssets();
	
	}());

}









//------------------------------------------------------------------------------------------------
//  
//  Animation Frame Retrieval
//  
//------------------------------------------------------------------------------------------------
window.onEnterFrame = (function () {
	return  window.requestAnimationFrame || 
	window.webkitRequestAnimationFrame   || 
	window.mozRequestAnimationFrame      || 
	window.oRequestAnimationFrame|| 
	window.msRequestAnimationFrame       || 
	function ( callback ) {
		window.setTimeout(callback, 1000 / 60);
	};
})();









//------------------------------------------------------------------------------------------------
//  
//  Math Utilities
//  
//------------------------------------------------------------------------------------------------

//------------------------------------
//  DynamicMatrix
//------------------------------------
function DynamicMatrix (columns, rows) {

	var numColumns = columns,
		numRows = rows,
		values = [];

	//------------------------------------
	//  Public Methods
	//------------------------------------
	var _getNumColumns = function () {
		return numColumns;
	}
	this.getNumColumns = _getNumColumns;

	var _getNumRows = function () {
		return numRows;
	}
	this.getNumRows = _getNumRows;

	var _setValues = function (newValues) {
		values = newValues;
	}
	this.setValues = _setValues;

	var _getValues = function () {
		return values;
	}
	this.getValues = _getValues;

	var _setValue = function (column, row, value) {
		values[row * numColumns + column] = value;
	}
	this.setValue = _setValue;

	var _getValue = function (column, row) {
		return values[row * numColumns + column];
	}
	this.getValue = _getValue;

	var _getRow = function (row) {
		var rtrn = [];
		for (var column=0; column<numColumns; column+=1) {
			rtrn.push(_getValue(column, row));
		}
		return rtrn;
	}
	this.getRow = _getRow;

	var _setRow = function (row, rowValues) {
		if (!rowValues || rowValues.length < numColumns) {
			return false;
		}
		for (var column=0; column<numColumns; column+=1) {
			setValue(column, row, rowValues[column]);
		}
		return true;
	}
	this.setRow = _setRow;

	var _getColumn = function (column) {
		var rtrn = [];
		for(var row=0; row<numRows; row+=1) {
			rtrn.push(_getValue(column,row));
		}
		return rtrn;
	}
	this.getColumn = _getColumn;

	var _setColumn = function (column, columnValues) {
		if (!columnValues || columnValues.length < numRows) {
			return false;
		}
		for (var row=0; row<numRows; row+=1) {
			_setValue(column, row, columnValues[row]);
		}
		return true;
	}
	this.setColumn = _setColumn;

	var _clone = function () {
		var rtrn = new DynamicMatrix(numColumns, numRows),
			newValues = [];
		for(var i=0; i<values.length; i+=1) {
			newValues[i] = values[i];
		}
		rtrn.setValues(newValues);
		return rtrn;
	}
	this.clone = _clone;

	var _addMatrix = function (m) {
		var rtrn;
		if(m.numRows === numRows && m.numColumns === numColumns) {
			rtrn = new DynamicMatrix(numColumns, numRows);
			var newValues = [],
				mValues = m.getValues();
			for(var i=0; i<values.length; i++) {
				newValues[i] = values[i] + mValues[i];
			}
			rtrn.setValues = newValues;
		} else {
			throw new Error("Error: Cannot add matrices of different sizes.");
		}
		return rtrn;
	}
	this.addMatrix = _addMatrix;

	var _subtractMatrix = function (m) {
		var rtrn;
		if(m.numRows === numRows && m.numColumns === numColumns) {
			rtrn = new DynamicMatrix(numColumns, numRows);
			var newValues = [];
			var mValues = m.getValues();
			for(var i=0; i<values.length; i++) {
				newValues[i] = values[i] - mValues[i];
			}
		} else {
			throw new Error("Error: Cannot subtract matrices of different sizes.");
		}
		return rtrn;
	}
	this.subtractMatrix = _subtractMatrix;

	var _multiplyMatrix = function (m) {
		var rtrn;
		var value = 0;
		if(m.numRows === numColumns) {
			rtrn = new DynamicMatrix(m.numColumns, numRows);
			for(var curColumn=0; curColumn<m.numColumns; curColumn+=1) {
				for(var row=0; row<numRows; row+=1) {
					value = 0;
					for(var column=0; column<numColumns; column+=1) {
						value += _getValue(column,row) * m.getValue(curColumn,column);
					}
					rtrn.setValue(curColumn, row, value);
				}
			}	
		}
		return rtrn;
	}
	this.multiplyMatrix = _multiplyMatrix;

	var _multiplyScalar = function (scalar) {
		var rtrn = new DynamicMatrix(numColumns, numRows);
		for(var row=0; row<numRows; row+=1) {
			for(var column=0; column<numColumns; column+=1) {
				rtrn.setValue(column, row, _getValue(column,row) * scalar);
			}
		}
		return rtrn;	
	}
	this.multiplyScalar = _multiplyScalar;

	var _multiplyRow = function (row, scalar) {
		var rtrn = _clone();
		for(var column=0; column<numColumns; column+=1) {
			rtrn.setValue(column, row, _getValue(column,row) * scalar);
		}
		return rtrn;		
	}
	this.multiplyRow = _multiplyRow;

	var _removeColumnRow = function (removeColumn, removeRow) {
		var rtrn,
			newNumRows = numRows,
			newNumColumns = numColumns,
			newValues = [];
		if (removeColumn !== "undefined" && removeColumn > -1) {
			newNumColumns--;
		}
		if (removeRow !== "undefined" && removeRow > -1) {
			newNumRows--;
		}
		rtrn = new DynamicMatrix(newNumColumns, newNumRows);
		for(var row=0; row<numRows; row+=1) {
			for(var column=0; column<numColumns; column+=1) {
				if (column === removeColumn || row === removeRow) {
					//continue;
				} else {
					newValues.push(_getValue(column, row));
				}
			}
		}
		rtrn.setValues(newValues);
		return rtrn;
	}
	this.removeColumnRow = _removeColumnRow;

	var _determinant = function () {
		var value,
			column;
		if(numColumns === numRows) {
			if(numColumns === 2) {
				return _getValue(0,0) * _getValue(1,1) - _getValue(1,0) * _getValue(0,1);
			} else {
				value = 0;
				for(column=0; column<numColumns; column+=1) {
					value += (_getValue(column, 0) * _getCofactor(column, 0));	
				}
				return value;
			}
		}
		return NaN;
	}
	this.determinant = _determinant;

	var _solveCramers = function () {
		var mainM = _removeColumnRow(numColumns - 1),
			d = mainM.determinant(),
			i = 0,
			mats = [],
			solution = [],
			mainMColumns = mainM.getNumColumns();
		if(Math.abs(d) < 0.0000001 || isNaN(d)) {
			return null;
		}
		for(i=0; i<mainMColumns; i+=1) {
			mats[i] = mainM.clone();
			mats[i].setColumn(i, _getColumn(numColumns-1));
			solution[i] = mats[i].determinant() / d;
		}
		
		return solution;
	}
	this.solveCramers = _solveCramers;

	var _transpose = function () {
		var rtrn;
		rtrn = new DynamicMatrix(numRows, numColumns);
		for(var row=0; row<numRows; row+=1) {
			for(var column=0; column<numColumns; column+=1) {	
				rtrn.setValue(row, column, _getValue(column,row));
			}	
		}
		return rtrn;
	}
	this.transpose = _transpose;

	var _getMinor = function (column, row) {
		return _removeColumnRow(column,row).determinant();
	}
	this.getMinor = _getMinor;

	var _getCofactor = function (column, row) {
		return Math.pow(-1, column+row+2) * _getMinor(column, row);			
	}
	this.getCofactor = _getCofactor;

	var _isEqual = function (m) {
		var mValues = m.getValues();
		var mNumColumns = m.getNumColumns();
		if(numColumns === mNumColumns && numRows) {
			for(var i=0; i<values.length; i+=1) {
				if (values[i] !== mValues[i]) {
					return false;
				}
			}
			return true;
		} else {
			return false;
		}
	}
	this.isEqual = _isEqual;

	var _toString = function () {
		var rtrn = "";
		for(var row=0; row<numRows; row+=1) {
			rtrn += "[";
			for(var column=0; column<numColumns; column+=1) {
				rtrn += _getValue(column, row) + "\t";
			}
			rtrn += "]\n";
		}
		return rtrn;
	}
	this.toString = _toString;

}

//------------------------------------
//  MultiCurveFormula
//------------------------------------
function MultiCurveFormula (mcPoints) {

	var coefficients,
		matrix,
		solutions = [],
		rtrn;

	//------------------------------------
	//  Public Methods
	//------------------------------------
	var _getInverseFormula = function (points) {
		var mat = new DynamicMatrix(points.length+1, points.length),
			solutions,
			coefficients;
		for(var i=0; i<points.length; i+=1) {
			for(var j=0; j<points.length; j+=1) {
				mat.setValue(i, j, Math.pow(points[i].y, points.length - j - 1));
			}
			mat.setValue(i, points.length, points[i].x);
		}
		solutions = mat.solveCramers();
		coefficients = solutions;
	}
	this.getInverseFormula = _getInverseFormula;

	var _getValue = function (x) {
		var rtrn = 0,
			i = 0;
		for(i=0; i<coefficients.length; i+=1) {
			rtrn += Math.pow(x, coefficients.length - i - 1 ) * coefficients[i];
		}
		return rtrn;
	}
	this.getValue = _getValue;


	//------------------------------------
	//  Initialization (Self-Executing)
	//------------------------------------
	(function () {
		
		matrix = new DynamicMatrix(mcPoints.length + 1, mcPoints.length);
		for(var i=0; i<mcPoints.length; i+=1) {
			for(var j=0; j<mcPoints.length; j+=1) {
				matrix.setValue(j, i, Math.pow(mcPoints[i].x, mcPoints.length - j - 1));
			}
			matrix.setValue(mcPoints.length, i, mcPoints[i].y);
		}
		solutions = matrix.solveCramers();
		coefficients = solutions;

	}());

}

//------------------------------------
//  PointDataSet
//------------------------------------
function Point (xValue, yValue) {

	var rtrn = {
		x: xValue,
		y: yValue
	}
	return rtrn;

}

