/**
 * 이 파일은 미니톡 유저차단 플러그인의 일부입니다. (https://www.minitalk.io)
 *
 * 특정유저를 차단합니다.
 * 
 * @file /plugins/banuser/script.js
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 1.0.1
 * @modified 2022. 10. 7.
 */
if (Minitalk === undefined) return;

/**
 * 차단할 수 있는 최대 유저수
 * 차단할 수 있는 유저수가 많아지면 사용자의 컴퓨터 성능에 따라 약간의 지연이 발생할 수 있습니다.
 */
me.limit = 20;

/**
 * 차단유저를 추가한다.
 */
me.addUser = function(minitalk,nickname) {
	minitalk.ui.showAlert("유저차단",nickname + "님을 차단하시겠습니까?<br>유저를 차단하게 되면 해당유저의 모든 메시지 및 귓속말, 호출 및 개인박스 초대가 차단됩니다.",[{
		text:"취소",
		class:"cancel",
		handler:function() {
			minitalk.ui.closeAlert();
		}
	},{
		text:"확인",
		class:"confirm",
		handler:function() {
			/**
			 * 브라우저의 스토리지에 차단할 대상의 닉네임을 추가한다.
			 */
			var banUsers = Minitalk.storage("banusers") ?? [];
			
			if (banUsers.length >= me.limit) {
				minitalk.ui.closeAlert();
				minitalk.ui.showAlert("안내","차단유저는 최대 " + me.limit + "명 까지만 가능합니다.",[{
					text:"확인",
					handler:function() {
						minitalk.ui.closeAlert();
					}
				}]);
				return;
			}
			
			if (banUsers.indexOf(nickname) === -1) {
				banUsers.push(nickname);
			}
			
			Minitalk.storage("banusers",banUsers);
			minitalk.ui.printSystemMessage("info",nickname+"님을 차단하였습니다.");
			
			me.updateConfigs(minitalk);
			me.updateUserTag(nickname);
			minitalk.ui.closeAlert();
		}
	}]);
};

/**
 * 차단유저를 제거한다.
 */
me.removeUser = function(minitalk,nickname) {
	minitalk.ui.showAlert("유저차단해제",nickname + "님을 차단해제 하시겠습니까?",[{
		text:"취소",
		class:"cancel",
		handler:function() {
			minitalk.ui.closeAlert();
		}
	},{
		text:"확인",
		class:"confirm",
		handler:function() {
			/**
	 		* 브라우저의 스토리지에 차단할 대상의 닉네임을 삭제한다.
	 		*/
			var banUsers = Minitalk.storage("banusers") ?? [];
			if (banUsers.indexOf(nickname) > -1) {
				banUsers.splice(banUsers.indexOf(nickname),1);
			}
			
			Minitalk.storage("banusers",banUsers);
			minitalk.ui.printSystemMessage("info",nickname+"님을 차단해제 하였습니다.");
			
			me.updateUserTag(nickname);
			me.updateConfigs(minitalk);
			minitalk.ui.closeAlert();
		}
	}]);
};

/**
 * 차단/차단해제한 경우 유저태그를 갱신한다.
 */
me.updateUserTag = function(nickname) {
	$("label[data-nickname="+nickname+"]").each(function() {
		var $user = $(this);
		var $nickname = $("span[data-role=nickname]",$user);
		var banUsers = Minitalk.storage("banusers") ?? [];
		if (banUsers.indexOf(nickname) > -1) {
			if ($("i.banned",$nickname).length == 0) {
				$nickname.append($("<i>").addClass("banned"));
			}
		} else {
			$("i.banned",$nickname).remove();
		}
	});
}

/**
 * 환경설정탭을 갱신한다.
 */
me.updateConfigs = function(minitalk) {
	var $configs = $("section[data-section=configs]");
	
	if ($configs.hasClass("open") == true) {
		var scrollTop = $("section[data-section=configs] > div[data-role=content]").scrollTop();
		minitalk.ui.createConfigs();
		var $content = $("div[data-role=content]",$configs);
		$content.append($("<hr>"));
		$content.append($("<h4>").html("차단유저관리"));
		$content.append($("<div>").addClass("banusers-help").html("차단유저는 사용자의 브라우저에 저장됩니다.<br>새로운 브라우저에서 접속하는 경우 차단설정이 유지되지 않습니다."));
		
		var banUsers = minitalk.storage("banusers") ?? [];
		for (var nickname of banUsers) {
			var $banuser = $("<div>").addClass("banuser");
			
			var $nickname = $("<span>").html(nickname);
			$banuser.append($nickname);
			
			var $button = $("<button>").attr("type","button").html('<i class="mi mi-trash"></i>').data("nickname",nickname);
			$button.on("click",function() {
				var $button = $(this);
				var nickname = $(this).data("nickname");
				me.removeUser(minitalk,nickname);
			});
			$banuser.append($button);
			
			$content.append($banuser);
		}
		
		if (banUsers.length == 0) {
			$content.append($("<div>").addClass("banusers-empty").html("아직 차단한 유저가 없습니다."));
		}
		
		$("section[data-section=configs] > div[data-role=content]").scrollTop(scrollTop);
	}
};

/**
 * 미니톡이 초기화되었을 때
 */
Minitalk.on("init",function(minitalk) {
	/**
	 * 메시지를 보낸 유저가 차단대상자일 경우 메시지를 출력하지 않는다.
	 */
	minitalk.on("beforeMessage",function(minitalk,message) {
		var banUsers = Minitalk.storage("banusers") ?? [];
		if (banUsers.indexOf(message.user.nickname) > -1) return false;
	});
	
	/**
	 * 호출한 유저가 차단대상자일 경우 호출을 무시한다.
	 */
	minitalk.on("beforeCall",function(minitalk,user) {
		var banUsers = Minitalk.storage("banusers") ?? [];
		if (banUsers.indexOf(user.nickname) > -1) return false;
	});
	
	/**
	 * 개인박스에 초대한 유저가 차단대상자일 경우 초대를 무시한다.
	 */
	minitalk.on("beforeInvite",function(minitalk,box,user) {
		var banUsers = Minitalk.storage("banusers") ?? [];
		if (banUsers.indexOf(user.nickname) > -1) return false;
	});
	
	/**
	 * 유저태그에 차단여부 아이콘을 추가한다.
	 */
	minitalk.on("userTag",function(minitalk,$user,user) {
		var banUsers = Minitalk.storage("banusers") ?? [];
		if (banUsers.indexOf(user.nickname) > -1) {
			var $nickname = $("span[data-role=nickname]",$user);
			$nickname.append($("<i>").addClass("banned"));
		}
	});
	
	/**
	 * 미니톡 환경설정 탭이 활성화될 때 차단유저를 관리하는 UI를 추가한다.
	 */
	minitalk.on("afterActiveTab",function(minitalk,tab) {
		if (tab == "configs") {
			me.updateConfigs(minitalk);
		}
	});
	
	/**
	 * 유저메뉴에 유저차단 메뉴를 추가한다.
	 */
	minitalk.user.appendMenu({
		text:"유저차단",
		iconClass:"xi xi-user-minus",
		visible:function(minitalk,user) {
			// 메뉴를 보이는 대상 (user) 가 나인 경우에는 해당 메뉴를 보이지 않는다.
			if (user.nickname == minitalk.user.me.nickname) return false;
			
			// 이미 차단중인 대상이라면 해당 메뉴를 보이지 않는다.
			var banUsers = Minitalk.storage("banusers") ?? [];
			if (banUsers.indexOf(user.nickname) > -1) return false;
			
			// 나머지 경우에 해당 메뉴를 보인다.
			return true;
		},
		handler:function(minitalk,user) {
			me.addUser(minitalk,user.nickname);
		}
	},"invite");
	
	/**
	 * 유저메뉴에 유저차단 메뉴를 추가한다.
	 */
	minitalk.user.appendMenu({
		text:"유저차단해제",
		iconClass:"xi xi-user-minus",
		visible:function(minitalk,user) {
			// 메뉴를 보이는 대상 (user) 가 나인 경우에는 해당 메뉴를 보이지 않는다.
			if (user.nickname == minitalk.user.me.nickname) return false;
			
			// 이미 차단중인 대상이 아니라면 해당 메뉴를 보이지 않는다.
			var banUsers = Minitalk.storage("banusers") ?? [];
			if (banUsers.indexOf(user.nickname) === -1) return false;
			
			// 나머지 경우에 해당 메뉴를 보인다.
			return true;
		},
		handler:function(minitalk,user) {
			me.removeUser(minitalk,user.nickname);
		}
	},"invite");
});