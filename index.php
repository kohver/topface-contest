<?php

//sleep(1);
$request = $_POST ? $_POST : $_GET;
$url = explode('/', urldecode($_SERVER['QUERY_STRING']), 4);
$viewer = array(id => 100, name => 'Юлия', average => 7);
$users = array(
    array(id => 1, age => 18, average => 7, name => 'Артем', photo => 'http://cs10308.userapi.com/u4718705/d_ee10b994.jpg', city => 'Россия, Архангельск', online => true, counter => 1),
    array(id => 2, age => 23, average => 8, name => 'Семен', photo => 'http://cs9719.userapi.com/u08182/d_1ab37b5b.jpg', city => 'Россия, Санкт-Петербург', online => true, counter => 25),
    array(id => 3, age => 19, average => 7, name => 'Алена', photo => 'http://cs5629.userapi.com/u15043123/d_ecb5ab33.jpg', city => 'Россия, Москва', counter => 312),
    array(id => 4, age => 22, average => 7, name => 'Валерия', photo => 'http://cs10932.userapi.com/u19191003/d_62f6dda4.jpg', city => 'Россия, Архангельск'),
    array(id => 5, age => 18, average => 7, name => 'Александра', photo => 'http://cs10226.userapi.com/u97017358/d_5d4bd610.jpg', city => 'Россия, Архангельск'),
    array(id => 6, age => 32, average => 7, name => 'Дмитрий', photo => 'http://cs4948.userapi.com/u1788979/d_102f4264.jpg', city => 'Россия, Архангельск', online => true)
);

if ($url[1] == 'ajax')
{
    array_shift($_GET);
    ini_set('display_errors', 'Off');
    ini_set('error_reporting', 0);
    header('Content-type: application/json; charset=utf-8');
    header('Cache-control: no-store');
    
    switch($url[2])
    {
        case 'getMessages':
            $id = intval($request['id']);
            $user = $users[$id - 1];
            $messages = null;
            
            if ($id == 2) {
                $messages = array(
                    array(id => 1, user => $user, text => 'привет как дела', date => '16:35'),
                    array(id => 2, user => $viewer, username => $viewer['name'], text => 'привет', date => '16:35'),
                    array(id => 3, user => $user, text => 'я хочу познакомиться', date => '16:35'),
                    array(id => 4, user => $user, rate => 8, date => '16:35'),
                    array(id => 5, user => $user, gift => 1, date => '16:35'),
                    array(id => 6, user => $viewer, text => 'ого, подарок', date => '16:35'),
                    array(id => 7, user => $user, text => 'Я помню чудное мгновенье:<br/>Передо мной явилась ты,<br/>Как мимолетное виденье,<br/>Как гений чистой красоты.', date => '16:35'),                    
                    array(id => 8, user => $viewer, text => 'отличные стихи, Семен', date => '16:35'),
                    array(id => 9, user => $user, rate => 9, date => '16:35'),
                    array(id => 10, user => $viewer, rate => 10, date => '16:35')
                );
            }
            elseif ($id > 2) {
                $messages = array();
                while (count($messages) < $id + 10) {
                    if (count($messages) % 1 == 0) $text = 'Стали доступны методы acco…';
                    if (count($messages) % 2 == 0) $text = 'Начинаем тестировать Apple (apns) и Android (c2dm) уведомления для Standalone приложений. Стали доступны методы acco…';
                    if (count($messages) % 3 == 0) $text = 'О да. Я тот человек, которого вы все ненавидите. Я зверь. Я ужас на крыльях ночи. ЭТО Я ОТВЕЧАЮ СМАЙЛИКОМ НА ВАШЕ КИЛОМЕТРОВОЕ СООБЩЕНИЕ';
                    if (count($messages) % 5 == 0) $text = 'Человек, который слушает джаз,<br/> может слушать вообще всё.<br/> Человек, который слушает шансон, может<br/> слушать только шансон.';
                    if (count($messages) % 7 == 0) $text = '- Любовь - это когда держишь его за руку, а чувствуешь сердце... - Это тахикардия.';
                    if (count($messages) % 11 == 0) $text = 'Путь к сердцу человека лежит через разорванную грудную клетку, все остальные утверждения - ванильная ересь.';
                    array_push($messages, array(id => count($messages) + 1, user => $user, text => $text, date => '16:20'));
                }
            }
            $data = array(messages => $messages, userinfo => $user);
        break;
        
        case 'sendMessage':
            $id = intval(rand(100, 10000));
            if ($id % 3 == 0) exit('ERROR');
            $rate = intval($request['rate']);
            $gift = intval($request['gift']);
            $text = preg_replace('/\n/', '<br/>', htmlspecialchars(trim($request['text'])));
            
            if     ($rate) $data = array(message => array(id => $id, user => $viewer, rate => $rate, date => '16:37'));
            elseif ($gift) $data = array(message => array(id => $id, user => $viewer, gift => $gift, date => '16:37'));
            elseif ($text) $data = array(message => array(id => $id, user => $viewer, text => $text, date => '16:37'));
        break;
        
        case 'deleteMessage':
            $id = intval($request['id']);
            $data = 1;
        break;
    }
    exit(json_encode(array(response => $data)));
}

?>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
  <head>
    <title>TopFace</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <link rel="stylesheet" type="text/css" href="/css/all.css" />
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
    <script type="text/javascript" src="/js/all.js"></script>
    <script type="text/javascript">
        var chat = new Chat(
            {
                viewer: <?=json_encode($viewer)?>,
                contacts: <?=json_encode($users)?>
            }
        );
        chat.init(1);
    </script>
  </head>
  <body>
    <div id="wrapper">
      <div id="left-column"></div>
      <div id="right-column"></div>
    </div>
  </body>
</html>