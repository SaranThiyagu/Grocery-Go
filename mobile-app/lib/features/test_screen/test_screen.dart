import 'package:flutter/material.dart';
import 'package:loginapp/core/utils/responsive_utils.dart';
import 'package:loginapp/core/widgets/safe_area_widget.dart';
import 'package:loginapp/core/widgets/text_widget.dart';
import 'package:loginapp/features/responsive/responsive.dart';

import '../../core/utils/colors.dart';
import '../../core/widgets/container_widget.dart';

class TestScreen extends StatelessWidget {
  const TestScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveWidget(
        mobileScreen: TestMobileScreen(),
        tabletScreen: TestTabletScreen()
    );
  }
}

final List<Color> color = [
  Colors.red,
  Colors.green,
  Colors.blue,
  Colors.yellow,
];

//// Mobile Screen

class TestMobileScreen extends StatefulWidget {
  const TestMobileScreen({super.key});

  @override
  State<TestMobileScreen> createState() => _TestMobileScreenState();
}

class _TestMobileScreenState extends State<TestMobileScreen> {

  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
        body: SingleChildScrollView(
          child: Padding(
            padding:  EdgeInsets.all(context.scale(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                TextWidget(text: "Mobile Screen",fontSize: context.scale(13),),
                SizedBox(height: context.scale(10),),
                ListView.builder(
                    itemCount: color.length,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (_,index){
                      return Padding(
                        padding:  EdgeInsets.only(bottom: context.scale(10)),
                        child: ContainerWidget(
                          height: context.scale(100),
                          width: context.scale(100),
                          backgroundColor: color[index],
                          child: SizedBox.shrink(),
                        ),
                      );
                    }
                )
              ],
            ),
          ),
        )
    );
  }
}

////  Tablet Screen

class TestTabletScreen extends StatefulWidget {
  const TestTabletScreen({super.key});

  @override
  State<TestTabletScreen> createState() => _TestTabletScreenState();
}

class _TestTabletScreenState extends State<TestTabletScreen> {
  @override
  Widget build(BuildContext context) {
    return SafeAreaWidget(
        body: SingleChildScrollView(
          child: Padding(
            padding:  EdgeInsets.all(context.scale(10)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: TextWidget(text: "Tablet Screen",fontSize: context.scale(13),)),
                SizedBox(height: context.scale(10),),
                SizedBox(
                  height: context.scale(100),
                  child: ListView.builder(
                      itemCount: color.length,
                       shrinkWrap: true,
                      //physics: const NeverScrollableScrollPhysics(),
                      scrollDirection: Axis.horizontal,
                      itemBuilder: (_,index){
                        return Padding(
                          padding:  EdgeInsets.only(right: context.scale(10)),
                          child: ContainerWidget(
                            height: context.scale(200),
                            width: context.scale(150),
                            backgroundColor: color[index],
                            child: SizedBox(),
                          ),
                        );
                      }
                  ),
                )
              ],
            ),
          ),
        )
    );
  }
}



