import { CreateCampaignApplicationOrganizerEmailDto } from './template.interface'
import { TemplateServiceSpecAdapter } from './template.service.spec-adapter'

describe('Template service', () => {
  let s: TemplateServiceSpecAdapter

  beforeEach(() => {
    s = new TemplateServiceSpecAdapter('./apps/api/src')
  })

  it('should render the campaign application email template', async () => {
    const t = new CreateCampaignApplicationOrganizerEmailDto({
      firstName: 'test',
      email: 'test@email',
      campaignApplicationLink: 'link',
      campaignApplicationName: 'campaignApplicationName',
    })

    const rendered = await s.getTemplate(t)
    // prettier-ignore-start
    /* eslint-disable */
    expect(rendered).toMatchInlineSnapshot(`
      {
        "html": "<!doctype html>
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <title></title>
          <!--[if !mso]><!-->
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <!--<![endif]-->
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style type="text/css">
            #outlook a { padding:0; }
            body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
            table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
            img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
            p { display:block;margin:13px 0; }
          </style>
          <!--[if mso]>
          <noscript>
          <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
          </xml>
          </noscript>
          <![endif]-->
          <!--[if lte mso 11]>
          <style type="text/css">
            .mj-outlook-group-fix { width:100% !important; }
          </style>
          <![endif]-->
          
            <!--[if !mso]><!-->
              <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,700" rel="stylesheet" type="text/css">
              <style type="text/css">
                @import url(https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,700);
              </style>
            <!--<![endif]-->

          
          
          <style type="text/css">
            @media only screen and (min-width:480px) {
              .mj-column-per-100 { width:100% !important; max-width: 100%; }
            }
          </style>
          <style media="screen and (min-width:480px)">
            .moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }
          </style>
          
        
          <style type="text/css">
          
          
          </style>
          <style type="text/css">
          
          </style>
          
        </head>
        <body style="word-spacing:normal;background-color:#ffffff;">
          
          
            <div
               style="background-color:#ffffff;"
            >
              
            
            <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="#009FE3" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
          
            
            <div  style="background:#009FE3;background-color:#009FE3;margin:0px auto;max-width:600px;">
              
              <table
                 align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#009FE3;background-color:#009FE3;width:100%;"
              >
                <tbody>
                  <tr>
                    <td
                       style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:0px;padding-top:0;text-align:center;"
                    >
                      <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
                  
            <div
               class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"
            >
              
            <table
               border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"
            >
              <tbody>
                
                    <tr>
                      <td
                         align="left" style="font-size:0px;padding:10px 25px;padding-top:50px;padding-right:25px;padding-bottom:30px;padding-left:25px;word-break:break-word;"
                      >
                        
            <div
               style="font-family:open Sans Helvetica, Arial, sans-serif;font-size:35px;font-weight:bold;line-height:1;text-align:left;color:#ffffff;"
            >Потвърждение за получаване на заявка за дарителска кампания</div>
          
                      </td>
                    </tr>
                  
              </tbody>
            </table>
          
            </div>
          
                <!--[if mso | IE]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
              
            </div>
          
            
            <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="#009fe3" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
          
            
            <div  style="background:#009fe3;background-color:#009fe3;margin:0px auto;max-width:600px;">
              
              <table
                 align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#009fe3;background-color:#009fe3;width:100%;"
              >
                <tbody>
                  <tr>
                    <td
                       style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:20px;padding-top:20px;text-align:center;"
                    >
                      <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:middle;width:600px;" ><![endif]-->
                  
            <div
               class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:middle;width:100%;"
            >
              
            <table
               border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:middle;" width="100%"
            >
              <tbody>
                
                    <tr>
                      <td
                         align="left" style="font-size:0px;padding:10px 25px;padding-right:25px;padding-left:25px;word-break:break-word;"
                      >
                        
            <div
               style="font-family:open Sans Helvetica, Arial, sans-serif;font-size:22px;line-height:1;text-align:left;color:#ffffff;"
            ><span style="color: #feeb35"> Здравейте, test, </span>
                <br /><br /></div>
          
                      </td>
                    </tr>
                  
                    <tr>
                      <td
                         align="left" style="font-size:0px;padding:10px 25px;padding-right:25px;padding-left:25px;word-break:break-word;"
                      >
                        
            <div
               style="font-family:open Sans Helvetica, Arial, sans-serif;font-size:15px;line-height:1;text-align:left;color:#ffffff;"
            >Благодарим Ви, че подадохте заявка за кампания на платформата Подкрепи.бг!<br />Можете да
                я прегледате
                <a style="color: #feeb35" href="link" target="_blank">ТУК</a
                >.<br /><br />

                Искаме да Ви уверим, че заявката Ви е успешно получена и ще бъде разгледана от екипа ни в
                най-кратък срок. Ако има нужда от допълнителна информация или уточнения, член на екип
                „Кампании“ ще се свърже с Вас.<br /><br />

                Междувременно, ако имате въпроси или желаете да предоставите допълнителни детайли за
                кампанията, можете да се свържете с нас на следния имейл:
                <a style="color: #feeb35" href="mailto:campaign_coordinators@podkrepi.bg" target="_blank"
                  >campaign_coordinators@podkrepi.bg</a
                >. Благодарим Ви, че заедно правим добро!<br /><br /></div>
          
                      </td>
                    </tr>
                  
                    <tr>
                      <td
                         align="left" style="font-size:0px;padding:10px 25px;padding-right:25px;padding-left:25px;word-break:break-word;"
                      >
                        
            <div
               style="font-family:open Sans Helvetica, Arial, sans-serif;font-size:15px;line-height:1;text-align:left;color:#ffffff;"
            >С уважение, <br />
                Екипът на Подкрепи.бг</div>
          
                      </td>
                    </tr>
                  
              </tbody>
            </table>
          
            </div>
          
                <!--[if mso | IE]></td></tr></table><![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
              
            </div>
          
            
            <!--[if mso | IE]></td></tr></table><![endif]-->
          
          
            </div>
          
        </body>
      </html>
        ",
        "metadata": {
          "subject": "Потвърждение за получаване на заявка за дарителска кампания ",
        },
      }
    `)
    /* eslint-enable */
    // prettier-ignore-start
  })
})
