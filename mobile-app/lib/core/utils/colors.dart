import 'package:flutter/services.dart';

class ColorStyles{

  static final  primaryColor      = HexColor("#ff000b");
  static final  blackColor        = HexColor("#121212");
  static final  blackColor01      = HexColor("#3F3849");
  static final  blackColor02      = HexColor("#1e1e1e");
  static final  blackColor03      = HexColor("#454545");
  static final  blackColor04      = HexColor("#363636");
  static final  blackColor05      = HexColor("#313131");
  static final  fontGrayColor     = HexColor("#C7C7C7");
  static final  fontGrayColor01   = HexColor("#646464");
  static final  fontGrayColor02   = HexColor("#ededed");
  static final  fontGrayColor03   = HexColor("#A8A8A8");
  static final  fontGrayColor04   = HexColor("#D8D8D8");
  static final  fontGrayColor05   = HexColor("#585858");
  static final  fontGrayColor06   = HexColor("#F3F3F3");
  static final  fontGrayColor07   = HexColor("#373737");
  static final  fontGrayColor08   = HexColor("#8C8C8C");
  static final  fontGrayColor09   = HexColor("#D9D9D9");
  static final  fontGrayColor10   = HexColor("#FAFAFA");
  static final  fontGrayColor11   = HexColor("#838BA1");
  static final  fontGrayColor12   = HexColor("#E3E3E3");
  static final  fontGrayColor13   = HexColor("#CACACA");
  static final  fontGrayColor14   = HexColor("#8E8E8E");
  static final  fontGrayColor15   = HexColor("#FAFAFA");
  static final  fontGrayColor16   = HexColor("#787878");
  static final  fontGrayColor17   = HexColor("#5B5B5B");
  static final  fontGrayColor18   = HexColor("#F2F2F2");
  static final  fontGrayColor19   = HexColor("#f3f4f6");
  static final  fontGrayColor20   = HexColor("#71717A");
  static final  fontGrayColor21   = HexColor("#494949");
  static final  fontGrayColor22   = HexColor("#9A9A9A");
  static final  checkBoxBorder    = HexColor("#6E6E6E");
  static final  redColor          = HexColor("#B50009");
  static final  redColor01        = HexColor("#E8000B");
  static final  redColor02        = HexColor("#8C0007");
  static final  redColor03        = HexColor("#FF000C");
  static final  redColor04        = HexColor("#E0413B");
  static final  redColor05        = HexColor("#FEF6F5");
  static final  redColor06        = HexColor("#FCEBEC");
  static final  whiteColor01      = HexColor("#F9F9F9");
  static final  whiteColor02      = HexColor("#FDFDFD");
  static final  greenColor        = HexColor("#006334");
  static final  greenColor01      = HexColor("#00A456");
  static final  greenColor02      = HexColor("#00A400");
  static final  greenColor03      = HexColor("#008043");
  static final  greenColor04      = HexColor("#166534");
  static final  greenColor05      = HexColor("#DCFCE7");
  static final  orange            = HexColor("#DE8100");
  static final  colors01          = HexColor("#EA3735");
  static final  colors02          = HexColor("#FFE6E7");
  static final  colors03          = HexColor("#6B0005");
  static final  colors04          = HexColor("#3F3849");
  static final  colors05          = HexColor("#92400E");
  static final  colors06          = HexColor("#4B5563");
  static final  colors07          = HexColor("#DCFCE7");
  static final  colors08          = HexColor("#FEF3C7");
  static final  colors09          = HexColor("#F3F4F6");
  static final  colors10          = HexColor("#64748B");
  static final  colors11          = HexColor("#475569");
  static final  colors12          = HexColor("#D5D5D5");
  static final  colors13          = HexColor("#353535");
  static final  colors14          = HexColor("#616161");
  static final  colors15          = HexColor("#2196F3");
  static final  colors16          = HexColor("#E3F2FD");
  static final  colors17          = HexColor("#D1D5DB");
  static final  colors18          = HexColor("#F8F6F6");
  static final  colors19          = HexColor("#9DA3AF");
  static final  colors20          = HexColor("#96504F");
  static final  colors21          = HexColor("#E6D1D0");
  static final  colors22          = HexColor("#E3E3E3");
  static final  colors23          = HexColor("#E53734");
  static final  colors24          = HexColor("#FBD8D6");
  static final  colors25          = HexColor("#F6E3E2");
  static final  colors26          = HexColor("#FFE2E2");
  static final  colors27          = HexColor("#6C7280");











  static final  whiteColor        = HexColor("#FFFFFF");
  static final  whiteColor1        = HexColor("#FCFBFB");


  static final  whiteColor03      = HexColor("#FCFCFC");



  static final  borderColor01     = HexColor("#252525");
  static final  disabledColors    = HexColor("#e6e6e6");


  static final  errorColor        = HexColor("#C8102E");

  static final  bgColor01         = HexColor("#f0f0f0");

  static final  orange01          = HexColor("#FFF3E6");
  static final  violet            = HexColor("#2755F8");
  static final  color09           = HexColor("#FF9E34");
  static final  color10           = HexColor("#16B218");
  static final  color11           = HexColor("#ff0000");
  static final  grey40            = HexColor("#F2F1F1");
  static final  grey45           = HexColor("#7E7E7E");


  static const  fontColor         = Color(0XFF6B6B6B);
  static const  backgroundColor   = Color(0XFFf3f3f3);
  static const  transparent       = Color(0x00000000);

}

class HexColor extends Color {
  static const MethodChannel _channel = MethodChannel('hexcolor');

  static Future<String> get platformVersion async {
    final String version = await _channel.invokeMethod('getPlatformVersion');
    return version;
  }

  static int _getColorFromHex(String hexColor) {
    hexColor = hexColor.toUpperCase().replaceAll("#", "");
    if (hexColor.length == 6) {
      hexColor = "FF$hexColor";
    }
    return int.parse(hexColor, radix: 16);
  }

  HexColor(final String hexColor) : super(_getColorFromHex(hexColor));
}