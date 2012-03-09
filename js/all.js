/*
*  Artyom Kohver
*  http://vk.com/itema  
*  © 2012
*/

function Chat(params)
{
    var viewer = params.viewer;
    var contacts = params.contacts;
    var selectedContact = null;
    var selectedUser = {};
    var hidenContact = null;
    var selectedMessageExample = 0;
    var isDialogEmpty = false;
    var lastMessage = {};
    var failedMessage = {};
    
    function init(contact)
    {
        $(document).ready(function() {
            contacts.sort(function (a, b) { return a.online ? -1 : (b.online ? 1 : 0); });
            $('#left-column').html(tmpl(UI_CONTACT_LIST, {contacts: contacts}));
            selectContact(contacts[contact || 0].id);
        });
    }
    
    // Public methods
    function selectContact(id)
    {
        if (hidenContact == id) return;
        if (selectedContact != id)
        {
            if (selectedContact) $('#contact' + selectedContact).removeClass('contact-selected');
            selectedContact = id;
            $('#contact' + id).addClass('contact-selected');
            
            $.ajax({
                url: '/ajax/getMessages/',
                data: {id: id},
                success: function(ajaxData) {
                    lastMessage = {user: {}};
                    var data =
                    {
                        userinfo: ajaxData.response.userinfo,
                        messages: ajaxData.response.messages
                    };
                    
                    if (data.messages)
                    $.each(data.messages, function(i, message) {
                        if (message.user)
                        {
                            if (message.user.id == lastMessage.user.id) message.user.name = '';
                            if (message.user.id == viewer.id) message.isViewer = true;
                            if (message.rate && message.user.average < message.rate) message.isSympathy = lastMessage.isSympathy ? 1 : true;
                        }
                        lastMessage = message;
                    });
                    
                    $('#right-column').html(tmpl(UI_USER_INFO, data.userinfo));
                    $('#right-column').append(tmpl(UI_DIALOG, data));
                    $('#right-column').append(tmpl(UI_POPUP));
                    $('#message-text').focus();
                    
                    if (!data.messages) isDialogEmpty = true;
                    else isDialogEmpty = false;
                    
                    selectedUser = data.userinfo;
                    update();
                },
                error: function(data) {
                    console.log(data);
                }
            });
        }
    }
    
    function hideContact(id)
    {
        if (selectedContact != id)
        {
            hidenContact = id;
            $('#contact' + id).slideUp(100);
        }
    }
    
    function sendMessage(type, params)
    {
        if (typeof type !== 'string') return;
        var textarea = $('#message-text');
        var messages = $('#messages');
        var callback = null;
        var data = {};
        
        switch (type)
        {
            case 'text':
                var text = params || textarea.val();
                if (!text) return textarea.focus();
                textarea.blur();
                data.text = text;
                callback = function()
                {
                    textarea.val('');
                    $('#compose .hint').html('<span class="icon"></span> Хотите узнать о прочтении сообщения? <span class="link" onclick="">Узнать</span>');
                }
            break;
            case 'rate':
                var rate = params;
                if (!rate) return;
                hidePopup();
                data.rate = rate;
            break;
            case 'gift':
                var gift = params;
                if (!gift) return;
                hidePopup();
                data.gift = gift;
            break;
        }
        
        if (!data) return;
        function onComplete()
        {
            if (isDialogEmpty)
            {
                messages.html('');
                isDialogEmpty = false;
            }
            if (failedMessage)
            {
                $("#failed-message").remove();
                failedMessage = {};
            }
            textarea.focus();
        }
        
        $.ajax({
            url: '/ajax/sendMessage/',
            type: 'post',
            data: data,
            success: function(ajaxData) {
                onComplete();
                
                var message = ajaxData.response.message
                if (message.user)
                {
                    if (message.user.id == lastMessage.user.id) message.user.name = '';
                    if (message.user.id == viewer.id) message.isViewer = true;
                    if (message.rate && message.user.average < message.rate) message.isSympathy = lastMessage.isSympathy ? 1 : true;
                }
                lastMessage = message;
                
                messages.append(tmpl(UI_MESSAGE, message));
                if (callback) callback();
                update();
            },
            error: function(data) {
                onComplete();
                messages.append(tmpl(UI_MESSAGE_ERROR));
                failedMessage = {type: type, params: params};
                update();
            }
        });
    }
    
    function resendMessage()
    {
        if (!failedMessage) return;
        sendMessage(failedMessage.type, failedMessage.params);
    }
    
    function deleteMessage(id)
    {
        hidePopup();
        $.ajax({
            url: '/ajax/deleteMessage/',
            data: {id: id},
            success: function(ajaxData) {
                var data = ajaxData.response;
                $('#message' + id).addClass('deleted');
                $('#message' + id + ' .content').html(tmpl(UI_MESSAGE_DELETED));
            },
            error: function(data) {
                console.log(data);
            }
        });
    }
    
    function showPopup(type, params)
    {
        if (typeof type !== 'string') return;
        var params = params || {};
        var popup = $('#popup');
        var background = $('#background');
        
        switch (type)
        {
            case 'message delete':
                var text = $('#message' + params.id + ' .text').html();
                if (text) params.text = text.replace(/[<br\/>]/g, ' ');
                popup.html(tmpl(UI_POPUP_MESSAGE_DELETE, params));
            break;
            case 'gift':
                params.sections =
                [
                    {purchase: 2, gifts: [{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1}]},
                    {purchase: 6, gifts: [{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1}]},
                    {purchase: 12, gifts: [{id: 1},{id: 1},{id: 1},{id: 1},{id: 1}]},
                    {purchase: 1, gifts: [{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1},{id: 1}]}
                ]
                popup.css({width: 635, marginLeft: -215, marginTop: -50}).html(tmpl(UI_POPUP_GIFTS, params));
            break;
            case 'rate':
                params.username = declension(selectedUser.name);
                popup.html(tmpl(UI_POPUP_RATE, params));
                
                var stars = popup.find('.content .stars .star');
                $.each(stars, function(i, obj) {
                    $(obj).mouseover(function(e) {
                        $.each(stars, function(i2, obj2) {
                            if (i2 <= i)
                            {
                                switch (true)
                                {
                                    case (i2 < 2): $(obj2).css({backgroundPosition: '-35px 0'}); break;
                                    case (i2 < 5): $(obj2).css({backgroundPosition: '-70px 0'}); break;
                                    case (i2 < 10): $(obj2).css({backgroundPosition: '-105px 0'}); break;
                                }
                            }
                        });
                    });
                    $(obj).mouseout(function(e) {
                        $.each(stars, function(i2, obj2) {
                            $(obj2).css({backgroundPosition: 0});
                        });
                    });
                    $(obj).click(function(e) {
                        sendMessage('rate', e.target.innerHTML);
                    });
                });
            break;
            default:
                popup.html(tmpl(UI_POPUP_DEFAULT, {content: type}));
            break;
        };
        popup.show();
        background.show();
    }
    
    function hidePopup()
    {
        $("#popup").removeAttr("style").hide();
        $('#background').hide();
    }
    
    function changeMessageExample()
    {
        var random = selectedMessageExample;
        var messages =
        [
            'Чертовски привлекательный!',
            'Стильный прикид!',
            'Отлично позируешь!',
            'Тебя надо клонировать, чтобы осчастливить побольше мужчин!',
            'Ты наверно много стоишь!'
        ];
        while (random == selectedMessageExample)
        {
            random = Math.floor(Math.random() * messages.length);
        }
        selectedMessageExample = random;
        $('#message-example').html(messages[random]);
    }
    
    // Private methods
    function update()
    {
        if (!isDialogEmpty)
        {
            $('#wrapper').css({backgroundColor: '#FFF'});
            $('#compose').css({backgroundColor: '#FFF'});
        }
        else
        {
            $('#wrapper').css({backgroundColor: '#f1f5fb'});
            $('#compose').css({backgroundColor: '#f1f5fb'});
        }
        $(window).scrollTop(document.body.scrollHeight || $('html, body')[0].scrollHeight);
    }
    
    function declension(word)
    {
        var lastLetter = word.substr(-1);
        switch (lastLetter)
        {
            case 'а': case 'е': case 'ё': case 'и': case 'о': case 'у': case 'ы': case 'ю': case 'я': case 'э':
                word = word.substr(0, word.length - 1) + 'е';
            break;
            default:
                word += 'у';
            break;
        }
        return word;
    }
    
    // Returns the instance methods
    return {
        init: init,
        selectContact: selectContact,
        showContact: selectContact,
        hideContact: hideContact,
        sendMessage: sendMessage,
        resendMessage: resendMessage,
        showPopup: showPopup,
        hidePopup: hidePopup,
        deleteMessage: deleteMessage,
        changeMessageExample: changeMessageExample
    };
};

(function() {
    var cache = {};
    this.tmpl = function tmpl(str, data) {
        try {
            var fn = (!/[^\w-]/.test(str))
            ? (cache[str] = cache[str] || tmpl($('#' + str).html()))
            : (new Function('obj',
                'var p=[],' +
                'print=function(){p.push.apply(p,arguments)},' +
                'isset=function(v){return obj[v] ? true : false},' +
                'each=function(ui,obj){for(var i=0; i<obj.length; i++) { print(tmpl(ui, $.extend(obj[i],{i:i}))) }};' +
                "with(obj){p.push('" + str
                .replace(/[\r\t\n]/g, ' ')
                .split("<?").join("\t")
                .split("'").join("\\'")
                .replace(/\t=(.*?)\?>/g, "',$1,'")
                .split("\t").join("');")
                .split("?>").join("p.push('")
                .split("\r").join("\\'")
                + "');} return p.join('');"
            ));
            return data ? fn(data) : fn;
        } catch(e) {
            console.log("p.push('" + str
                .replace(/[\r\t\n]/g, ' ')
                .split("<?").join("\t")
                .split("'").join("\\'")
                .replace(/\t=(.*?)\?>/g, "',$1,'")
                .split("\t").join("');")
                .split("?>").join("p.push('")
                .split("\r").join("\\'")
                + "');} return p.join('');"
            + "')");
            throw e;
        };
    };
})();

UI_CONTACT_LIST =
'<div id="contact-list">' +
  '<? if (isset("contacts")) { ?>' +
    '<? each(UI_CONTACT, contacts); ?>' +
  '<? } else { ?>' +
    '<div>Contact list is empty</div>' +
  '<? } ?>' +
'</div>';
    
UI_CONTACT =
'<div onclick="chat.showContact(<?=id?>)" id="contact<?=id?>" class="contact">' +
  '<span class="<?=isset("online") ? "online" : "offline"?>"></span>' +
  '<span class="name"><?=name?>, <?=age?></span>' +
  '<? if (isset("counter")) { ?>' +
    '<div class="counter"><?=counter?></div>' +
  '<? } ?>' +
  '<div class="close" onclick="chat.hideContact(<?=id?>)"></div>' +
  '<div class="photo"><img src="<?=photo?>" alt="" /></div>' +
'</div>';
    
UI_USER_INFO =
'<div id="user-info">' +
  '<div class="photo"><img src="<?=photo?>" alt="" /></div>' +
  '<div class="summary">' +
    '<div class="name"><a href="/"><?=name?>, <?=age?></a></div>' +
    '<div class="city"><?=city?></div>' +
  '</div>' +
  '<div class="actions">' +
    '<div class="action"><span class="link">Добавить в контакты</span></div>' +
    '<div class="action"><span class="link">Пожаловаться</span></div>' +
  '</div>' +
'</div>';
    
UI_DIALOG =
'<div id="dialog">' +
  '<div id="messages">' +
    '<? if (isset("messages")) { ?>' +
      '<? each(UI_MESSAGE, messages); ?>' +
    '<? } else { ?>' +
      '<div class="hint">' +
        '<div class="title">Начни с интересной фразы</div>' +
        '<div>Произведи хорошее впечатление!</div>' +
        '<div><span class="link" onclick="chat.sendMessage(\'text\', $(\'#message-example\').html())">«<span id="message-example">Чертовски привлекательный!</span>»</span></div>' +
        '<div class="change-example"><span class="icon"></span><span class="link" onclick="chat.changeMessageExample()">Другой комплимент</span></div>' +
      '</div>' +
      '<div class="empty">Напиши первое сообщение</div>' +
    '<? } ?>' +
  '</div>' +
  '<div id="compose">' +
    '<div class="hint"></div>' +
    '<div class="textarea">' +
      '<textarea placeholder="Введите текст сообщения..." id="message-text" onkeydown="if ((event.ctrlKey || event.metaKey) && event.keyCode == 13) chat.sendMessage(\'text\')"></textarea>' +
    '</div>' +
    '<div class="actions">' +
      '<span class="action">' +
        '<span class="button" onclick="chat.sendMessage(\'text\')" title="Ctrl+Enter">Отправить</span>' +
      '</span>' +
      '<span class="action">' +
        '<span class="icon gift"></span>' +
        '<span class="link" onclick="chat.showPopup(\'gift\')">Отправить подарок</span>' +
      '</span>' +
      '<span class="action">' +
        '<span class="icon star"></span>' +
        '<span class="link" onclick="chat.showPopup(\'rate\')">Отправить оценку</span>' +
      '</span>' +
      '<span class="action pin">' +
        '<span class="link" onclick="var el = $(\'#compose\'), cls = \'compose-no-fixed\'; el.hasClass(cls) ? (el.removeClass(cls), this.innerHTML = \'Открепить\') : (el.addClass(cls), this.innerHTML = \'Закрепить\')">Открепить</span>' +
      '</span>' +
    '</div>' +
  '</div>' +
'</div>';
    
UI_MESSAGE =
'<div class="message" id="message<?=id?>">' +
  '<div class="username <? if (isset("isViewer")) print("viewer"); ?>"><?=user.name?></div>' +
  '<div class="content clearFix">' +
    '<? if (isset("text")) print(tmpl(UI_MESSAGE_TEXT, {text: text, isViewer: isset("isViewer")})); ?>' +
    '<? if (isset("gift")) print(tmpl(UI_MESSAGE_GIFT, {gift: gift, isViewer: isset("isViewer")})); ?>' +
    '<? if (isset("rate")) print(tmpl(UI_MESSAGE_RATE, {rate: rate, isViewer: isset("isViewer"), isSympathy: isset("isSympathy") ? isSympathy : false})); ?>' +
  '</div>' +
  '<div class="delete" onclick="chat.showPopup(\'message delete\', {id:\'<?=id?>\'})"></div>' +
  '<div class="date"><?=date?></div>' +
'</div>';

UI_MESSAGE_ERROR =
'<div class="message" id="failed-message">' +
  '<div class="content clearFix">' +
    '<span class="icon-error"></span> Ваше сообщение не доставлено. <span class="link" onclick="chat.resendMessage()">Повторить попытку</span>' +
  '</div>' +
'</div>';

UI_MESSAGE_TEXT =
'<div class="text">' +
  '<?=text?>' +
'</div>';

UI_MESSAGE_RATE =
'<div class="rate">' +
  '<? if (isset("isViewer")) { ?>' +
    '<? if (!isset("isSympathy")) { ?>' +
      '<span class="star"><?=rate?></span> Вы отправили оценку. <span class="link" onclick="chat.showPopup(\'rate\')">Отправить еще</span>' +
    '<? } else if (isSympathy === 1) { ?>' +
      '<span class="attach"><img src="/img/heart2.png" alt="" /></span> Вы отправили взаимную симпатию! <span class="link" onclick="chat.showPopup(\'gift\')">Подарок</span> — лучший способ продолжить отношения' +
    '<? } else { ?>' +
      '<span class="attach"><img src="/img/heart.png" alt="" /></span> Вы отправили симпатию. <span class="link" onclick="chat.showPopup(\'gift\')">Подарок</span> — лучший способ продолжить отношения' +
    '<? } ?>' +
  '<? } else { ?>' +
    '<? if (!isset("isSympathy")) { ?>' +
      '<span class="star"><?=rate?></span> Вас оценили. <span class="link" onclick="chat.showPopup(\'rate\')">Оценить в ответ</span>' +
    '<? } else if (isSympathy === 1) { ?>' +
      '<span class="attach"><img src="/img/heart2.png" alt="" /></span> У вас взаимная симпатия! <span class="link" onclick="chat.showPopup(\'gift\')">Подарок</span> — лучший способ продолжить отношения' +
    '<? } else { ?>' +
      '<span class="attach"><img src="/img/heart.png" alt="" /></span> Ты понравился. <span class="link" onclick="chat.sendMessage(\'rate\', 10)">Отправить взимную симпатию</span>' +
    '<? } ?>' +
  '<? } ?>' +
'</div>';

UI_MESSAGE_GIFT =
'<div class="gift">' +
  '<? if (isset("isViewer")) { ?>' +
    '<span class="attach"><img src="/img/gift<?=gift?>.png" alt="" /></span> Вы отправили подарок. <span class="link" onclick="chat.showPopup(\'gift\')">Отправить еще</span>' +
  '<? } else { ?>' +
    '<span class="attach"><img src="/img/gift<?=gift?>.png" alt="" /></span> Вам отправили подарок. <span class="link" onclick="chat.showPopup(\'gift\')">Отправить подарок в ответ</span>' +
  '<? } ?>' +
'</div>';
    
UI_MESSAGE_DELETED =
'<div class="system">Сообщение было удалено.</div>';
    
UI_POPUP =
'<div id="background" onclick="chat.hidePopup()"></div>' +
'<div id="popup"></div>';

UI_POPUP_DEFAULT =
'<div class="close" onclick="chat.hidePopup()"></div>' +
'<div class="content"><?=content?></div>';
    
UI_POPUP_MESSAGE_DELETE =
'<div class="close" onclick="chat.hidePopup()"></div>' +
'<div class="content">' +
  '<div>Вы действительно хотите удалить сообщение?</div>' +
  '<? if (isset("text")) { ?>' +
    '<div class="quote">«<span><?=text?></span>»</div>' +
  '<? } ?>' +
'</div>' +
'<div class="actions">' +
  '<div class="action">' +
    '<div class="button" onclick="chat.deleteMessage(<?=id?>)">Удалить</div>' +
  '</div>' +
  '<div class="action"><span class="link-gray" onclick="chat.hidePopup()">Нет, не надо удалять</span></div>' +
'</div>';
    
UI_POPUP_GIFTS =
'<div class="close" onclick="chat.hidePopup()"></div>' +
'<div class="title">Подарки</div>' +
'<div class="content">' +
  '<? each(UI_POPUP_GIFTS_SECTION, sections); ?>' +
'</div>';

UI_POPUP_GIFTS_SECTION =
'<div class="section">' +
  '<div class="title"><b>Подарки за <?=purchase?></b></div>' +
  '<div class="gifts">' +
    '<? each(UI_POPUP_GIFT, gifts); ?>' +
  '</div>' +
  '<? if (gifts.length > 8) { ?>' +
    '<div class="right-arrow" onclick="var el = $(this).parent().find(\'.gifts\'); el.animate({marginLeft: -el.width()}); $(this).fadeOut(200)"></div>' +
  '<? } ?>' +
'</div>';
    
UI_POPUP_GIFT =
'<span class="gift" onclick="chat.sendMessage(\'gift\', <?=id?>)"><img src="/img/gift<?=id?>.png" alt="" /></span>';
    
UI_POPUP_RATE =
'<div class="close" onclick="chat.hidePopup()"></div>' +
'<div class="content">' +
  'Отправьте <?=username?> оценку' +
  '<div class="stars clearFix">' +
    '<div class="star">1</div>' +
    '<div class="star">2</div>' +
    '<div class="star">3</div>' +
    '<div class="star">4</div>' +
    '<div class="star">5</div>' +
    '<div class="star">6</div>' +
    '<div class="star">7</div>' +
    '<div class="star">8</div>' +
    '<div class="star">9</div>' +
    '<div class="star">10</div>' +
  '</div>' +
'</div>';