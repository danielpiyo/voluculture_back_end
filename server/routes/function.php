<?php

//session_start();
ob_start();

class Ngodetails 

{

//global $wpdb;

 function ngo_login($Ngo_email,$Ngo_password){
    global $wpdb;
    $result = $wpdb->get_row("SELECT * FROM  wp_ngo_details WHERE ngo_email = '$Ngo_email' AND ngo_password = '$Ngo_password'");

    

    if($result-> ngo_status != "Active"){

 

        echo"Hey {$result->ngo_name} please activate your account through the email you registered with";



    }elseif($result-> ngo_status == "Active"){



      $_SESSION['NGO_ID'] = $result->ID;
        echo"Hey {$result->ngo_name} welcome to voluculture";        
        $url = 'http://localhost/voluculture/ngo/';
        wp_redirect($url);
    }

    

    }





   function ngo_signup($Ngo_email, $Ngo_name,$ngo_country,$Ngo_password,$Ngo_password_confirm){

$code = rand(2000000000,4000000000);
global $wpdb;

 if($Ngo_password != $Ngo_password_confirm){

            echo"Password do not match";

        }else{

            $result = $wpdb->insert('wp_ngo_details',array(



                'ngo_email'=> $Ngo_email,

//      'ngo_username'=> $Ngo_username,

                'ngo_name'=>$Ngo_name,

                'ngo_country'=>$ngo_country,

                'ngo_password' =>$Ngo_password,

                'ngo_code' => $code,

        'ngo_status'=>'notactive'




            ));



            if(!$result){

                echo"Not registered with voluculture";

            }

            else{





                $link = "http://localhost/voluculture/verify/?id=$code&user=$Ngo_name";

                $subject ="VOLUCULTURE NGO REGISTRATION";

                $body = "<div style='text-align:center'><h3> Hi <b class='color:blue'>$Ngo_name</b> you have succesfully Registered with Voluculture.We are glad to start this journey with you, use the code below to activate your account.Welcome to Voluculture.</h3>

                <p>$code<hr></p>

                <div style='inline-block'><a href='$link'><button style='background-color:orange; color:black'>Click to login</button></a></div>

                ";

                $headers = array('Content-Type: text/html; charset=UTF-8');

         

                wp_mail($Ngo_email,$subject,$body,$headers); 

                echo"Thank you for choosing voluculture. You are Now registered";

          $url = 'http://localhost/voluculture/ngo-login/';
           wp_redirect($url);


         }

        }



    }



function Ngo_verification($code,$Ngo_name){
    global $wpdb;

   $result = $wpdb->update('wp_ngo_details',array(

        'ngo_status'=>"Active"

    ),array(

        'ngo_code'=>$code

    ));

    if($result){

        echo"Hey {$name} your account has been verified";
        $url = 'http://localhost/voluculture/ngo-login/';
        wp_redirect($url);

    }else{

        echo"Account not verified";
        $url = 'http://localhost/voluculture/ngo-sign-up/';
        wp_redirect($url);

    }

}


//Getting NGO Profile details
function ngo_profile_setup($org_name,$ngo_email,$ngo_org_director,
                            $ngo_fyear,$ngo_address,$ngo_description,
                            $ngo_vision,$ngo_mission,$ngo_we_do,$ngo_we_are
                            ){
     global $wpdb;
                    if(
                        $org_name != '' || $ngo_email != '' || $ngo_org_director != ''||
                        $ngo_fyear != ''|| $ngo_address != ''|| $ngo_description != ''||
                        $ngo_vision != ''|| $ngo_mission != ''||$ngo_we_do != ''|| $ngo_we_are != ''
                      ){
                            $result = $wpdb->insert('wp_ngo_info',array(
                                                                'ngo_email'=>$ngo_email,'org_name'=>$org_name,
                                                                'ngo_org_director'=>$ngo_org_director,'ngo_fyear'=>$ngo_fyear,
                                                                'ngo_address'=>$ngo_address,'ngo_description'=>$ngo_description,
                                                                'ngo_vision'=>$ngo_vision,'ngo_mission'=>$ngo_mission,
                                                                'ngo_we_do'=>$ngo_we_do,'ngo_we_are'=>$ngo_we_are
                                                    ));
                                if(!$result){
                                            echo"Error Posting Your Data";
                                             }
                                    else{
                                            echo"Profile succesfully Added";
                                        }
                        }
                    else{
                            echo"Please fill all the fields";
                         }

           } 
// posting opportunity
function ngo_opportunity_post(
                                $ngo_opp_name, $ngo_opp_address,
                                $ngo_opp_description, $ngo_opp_location,
                                $ngo_opp_skills, $ngo_opp_start_date,
                                $ngo_opp_end_date
                            ){
    global $wpdb;
                        if(
                        $ngo_opp_name != '' || $ngo_opp_address != '' ||
                        $ngo_opp_description != '' || $ngo_opp_location != '' ||
                        $ngo_opp_skills != '' || $ngo_opp_start_date != '' ||
                        $ngo_opp_end_date != ''
                        ){
                                        $result = $wpdb->insert('wp_ngo_opportunity',array(
                                                                'ngo_opp_name'=> $ngo_opp_name,
                                                                'ngo_opp_address'=> $ngo_opp_address,
                                                                'ngo_opp_description'=>  $ngo_opp_description,
                                                                'ngo_opp_location'=>  $ngo_opp_location,
                                                                'ngo_opp_skills'=>  $ngo_opp_skills,
                                                                'ngo_opp_start_date'=> $ngo_opp_start_date,
                                                                'ngo_opp_end_date'=> $ngo_opp_end_date
                                                                ));
                                            if(!$result){
                                                        echo"Error Posting Your Opportunity data";
                                                         }
                                                else{
                                                        echo"Oppportunity succesfully Added";
                                                    }
                                    }
                                else{
                                        echo"Please fill all the fields";
                                     }
                            }

    function ngo_activity_post(
                            $ngo_event_name, $ngo_event_location,
                            $ngo_event_description, $ngo_event_start,
                            $ngo_event_end, $ngo_event_start_time,
                            $ngo_event_end_time 

                             ){
           global $wpdb;
                                if(
                                    $ngo_event_name != '' || $ngo_event_location != '' ||
                                    $ngo_event_description != '' || $ngo_event_start != '' ||
                                    $ngo_event_end != '' || $ngo_event_start_time != '' ||
                                    $ngo_event_end_time != ''
                                    ){
                                       
                                        $result = $wpdb->insert('wp_ngo_activity',array(
                                                                'ngo_event_name'=>  $ngo_event_name,
                                                                'ngo_event_location'=> $ngo_event_location,
                                                                'ngo_event_description'=>  $ngo_event_description,
                                                                'ngo_event_start'=>  $ngo_event_start,
                                                                'ngo_event_end'=> $ngo_event_end,
                                                                'ngo_event_start_time'=> $ngo_event_start_time,
                                                                'ngo_event_end_time'=> $ngo_event_end_time
                                                                ));
                                            if(!$result){
                                                        echo"Error Posting Your Activities data";
                                                        }
                                             else{
                                                      echo"Activities succesfully Added";
                                                 } 
                                    }
                                else{
                                        echo"Please fill all the fields";
                                     }

                         }

        function ngo_contact_post(
                                $ngo_phone,
                                $ngo_address_zip,
                                $ngo_city,
                                $ngo_facbook,
                                $ngo_linkedin,
                                $ngo_twitter,
                                $ngo_intagram
                                ){
            global $wpdb;
                            if(
                                $ngo_phone != '' ||
                                $ngo_address_zip != '' ||
                                $ngo_city != '' 
                                ){
                                    $result = $wpdb->insert('wp_ngo_activity',array(
                                                            'ngo_phone'=> $ngo_phone,
                                                            'ngo_address_zip'=>  $ngo_address_zip,
                                                            'ngo_city'=> $ngo_city,
                                                            'ngo_facbook'=>  $ngo_facbook,
                                                            'ngo_linkedin'=> $ngo_linkedin,
                                                            'ngo_linkedin'=> $ngo_linkedin,
                                                            'ngo_twitter'=> $ngo_twitter,
                                                            'ngo_intagram'=> $ngo_intagram
                                                            ));
                                    if(!$result){
                                                echo"Error Posting Your Contact data";
                                                }
                                    else{
                                            echo"Contacts succesfully Added";
                                        } 

                            }
                            else{
                                echo"Please fill all the fields";
                             }

        }

}

ob_get_clean();
?>
