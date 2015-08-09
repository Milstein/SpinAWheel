// Slot Machine IW - 2014
var fullShape, halfShape, layout, fullTurn, colSpun;
var rndTime = Math.ceil(Math.random() * 1100 + 1100); //random timer multiplier (1100-2200)
var fillArrays = 9; // amount of fill arrays
var slotImg = [];
var rndSpin = Math.floor(Math.random() * 4 + 5);
var prizeID = 0;
// 1 = Gift Card
// 2 = Taste of Home Online Cooking School (iPad)
// 3 = Pink Cookbook

function loadGame()
{
 
    $(".gameSkip").click(function() { $("#slotDialogue").fadeOut(); });

    logToConsole('prize Description = ' + prizeDesc);

    //game reset on design change
    fader('hide');
    $('#slotDialogue').hide();
    $('#dialog').fadeOut();
    colSpun = 0;

    //minimum of at least 5 images per slot column
    slotImg[0] = '<img src="images/Games/slotMachine/img1.png" class="img-responsive" />';
    slotImg[1] = '<img src="images/Games/slotMachine/img2.png" class="img-responsive" />';
    slotImg[2] = '<img src="images/Games/slotMachine/img3.png" class="img-responsive" />';
    //slotImg[3] = '<img src="images/Games/slotMachine/img1.png" class="img-responsive" />';
    //slotImg[4] = '<img src="images/Games/slotMachine/img2.png" class="img-responsive" />';
    //slotImg[5] = '<img src="images/Games/slotMachine/img3.png" class="img-responsive" />';

    $('.column').empty();
    popImg('colA');
    popImg('colB');
    popImg('colC');
    popImg('colA');
    popImg('colB');
    popImg('colC');
    popImg('colA');
    popImg('colB');
    popImg('colC');
    popImg('colA');
    popImg('colB');
    popImg('colC');
    popImg('colA');
    popImg('colB');
    popImg('colC');

    $('.column img').first().imagesLoaded(function()
    {
        fullShape = $(".column img").first().outerHeight(true); //full shape height + top bot margin
        halfShape = fullShape / 2;
        fullTurn = fullShape * slotImg.length // full turn of dial (img height + margins * number of images)

        logToConsole('fullShape=' + fullShape + ',halfShape=' + halfShape + ',fullTurn=' + fullTurn);

        //Have spin load and move to start (use css margin-top without easing to load them without movement)
        $('#colA').animate({ marginTop: '+=' + fullShape * prizeID + 'px' }, 800, 'easeInOutBack');
        logToConsole('+=' + fullShape * prizeID + 'px');
        if (prizeID == 1)
        {
            $('#colB').animate({ marginTop: '-=' + (fullShape * prizeID) + 'px' }, 800, 'easeInOutBack');
            logToConsole('Winning Image: Gift Card.  -=' + fullShape * prizeID + 'px');
        } else if (prizeID == 2)
        {
            $('#colB').animate({ marginTop: '-=' + ((fullShape * prizeID) + fullShape) + 'px' }, 800, 'easeInOutBack');
            logToConsole('Winning Image: Taste of Home.  -=' + fullShape * prizeID + 'px');
        } else if (prizeID == 3)
        {
            $('#colB').animate({ marginTop: '-=' + ((fullShape * prizeID) - fullShape) + 'px' }, 800, 'easeInOutBack');
            logToConsole('Pink Book.  -=' + fullShape * prizeID + 'px');
        } else
        {
            $('#colB').animate({ marginTop: '-=' + (fullShape * 2) + 'px' }, 800, 'easeInOutBack');
            logToConsole('Pink Book.  -=' + fullShape * prizeID + 'px');
        }
        $('#colC').animate({ marginTop: '+=' + fullShape * prizeID + 'px' }, 800, 'easeInOutBack', function()
        {
            logToConsole('+=' + fullShape * prizeID + 'px');
            logToConsole('prize: ' + prizeID);
            //fade in in spin box after columns are done inital move
            //$('#slotDialogue').fadeIn();

            $(".gameContinueBtn").unbind().bind("click", function()
            {
                //$('#slotDialogue').fadeOut('fast');
                $(this).unbind().fadeTo(400, 0.5).attr("disabled", "true");
                spinCol('colA');
                spinCol('colB');
                spinCol('colC');

                return false;
            });
        });

        rtm_unblockUI();
    });
};

function popImg(columnID)
{
    for (var i = 0; i <= 5; i++)
    {
        $('#' + columnID).append(slotImg[i]);
    }
}

function spinCol(columnID)
{
    for (var i = 0; i <= fillArrays; i++)
    {
		alert('f');
        $('#' + columnID).prepend(slotImg);
        $('#' + columnID).css('margin-top', '-=' + 2280 + 'px');
    }
    if (win == true || win == "true")
    {
        if (prizeID == 1)
        {
            spinAmount = (columnID == 'colB') ? ((fullTurn * rndSpin) + fullShape) + fullShape : (fullTurn * rndSpin);
        } else if (prizeID == 2)
        {
            spinAmount = (columnID == 'colB') ? ((fullTurn * rndSpin) + fullShape * (prizeID * 2)) + fullShape : (fullTurn * rndSpin);
        } else if (prizeID == 3)
        {
            spinAmount = (columnID == 'colB') ? ((fullTurn * rndSpin) + fullShape) + fullShape : (fullTurn * rndSpin);
        }
    } else
    {
        spinAmount = (columnID == 'colB') ? (fullTurn) - fullShape : (fullTurn * rndSpin) + halfShape;
    }
    //have columns stop 600 ms after each other
    if (columnID == 'colB') { rndTime = rndTime + 600 }
    if (columnID == 'colC') { rndTime = rndTime + 600 }

    $('#' + columnID).animate({ marginTop: '+=' + spinAmount + 'px' }, rndTime * 4, 'easeOutSine', function()
    {
        colSpun++;
        if (colSpun >= 3)
        {
            gameEnd();
        }
    });
}

