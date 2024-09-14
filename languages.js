setLangViForElements();
$("#lang-switch").change(function () { // put onchange event when user select option from select
    var lang = $(this).val(); // decide which language to display using switch case. The rest is obvious (i think)
    console.log("lang-switch to " + lang);
    switch (lang) {
        case "en":
            $("#lang-lable").html("Language");            
            setLangEnForElements();            
        	break;
        case "vi":
        default:
            $("#lang-lable").html("Ngôn ngữ");
            setLangViForElements();
            break;
        }
});

function setLangEnForElements() {
    console.log("lang en");
    $("#new-game").html("Create Game");
    $("#join-game").html("Join Game");
    $("#label-send-id").html("Send created Game ID to other person");
    $("#opponent-grid-title").html("Opponent's Board");
    $("#player-grid-title").html("Your Board");
    $("#lable-guide-placement").html("Click to place Ships");
    $("#ship-label").html("Place the: ");
    $("#horizontal-label").html("Horizontally");
    $("#vertical-label").html("Vertically");
    $("#place-confirm").html("Confirm");
    $("#game-ready").html("Ready");
    $("#game-rematch").html("Rematch?");
}

function setLangViForElements() {
    console.log("lang vi");
    $("#new-game").html("Tạo Game");
    $("#join-game").html("Tham gia");
    $("#label-send-id").html("Gửi ID vừa tạo cho người khác");
    $("#opponent-grid-title").html("Hạm đội đối thủ");
    $("#player-grid-title").html("Hạm đội của tôi");
    $("#lable-guide-placement").html("Click để đặt thuyền");
    $("#ship-label").html("Đặt thuyền: ");
    $("#horizontal-label").html("Ngang");
    $("#vertical-label").html("Dọc");
    $("#place-confirm").html("Xác nhận");
    $("#game-ready").html("Sẵn sàng");
    $("#game-rematch").html("Làm ván mới?");
}
