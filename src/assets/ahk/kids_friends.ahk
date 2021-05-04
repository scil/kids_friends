#SingleInstance Ignore

GroupAdd, ExplorerWindows, ahk_class Progman ;Desktop
GroupAdd, ExplorerWindows, ahk_class CabinetWClass ;Explorer Window
GroupAdd, ExplorerWindows, ahk_class ExploreWClass ;Other Explorer Window

; 为了识别双击 相关知识：
; How to assign action for Double Click? https://www.autohotkey.com/boards/viewtopic.php?t=64149
; 这个帖子未细看：Easiest way to detect double clicks? https://autohotkey.com/board/topic/56493-easiest-way-to-detect-double-clicks/ 
DblClickTime := DllCall("GetDoubleClickTime", "UInt")
;MsgBox, DblClickTime = %DblClickTime% ms


; 用剪切板方式获取鼠标点击的文件的名字 缺点是 
;       双击Explorer.exe 的非文件列表区域 只要有文件处于选中状态 就会返回这个文件的名字 
GetFilePath() {
        ClipSave:=ClipboardAll
        Clipboard:=""

        Send ^c
        ClipWait, .2
        Path=%clipboard%

        Clipboard:=ClipSave
        Return Path
}


Return ;end of Auto Execute



#IfWinActive, ahk_group ExplorerWindows

; why $? 
; 其实：The $ prefix has no effect for mouse hotkeys, since they always use the mouse hook. 
; https://www.autohotkey.com/docs/Hotkeys.htm#prefixdollar
$LButton::

        ; 单击
        ; 网上多是用 LButton，这里改用 Click，原因：LButton and RButton correspond to the "physical" left and right buttons when used with Send, but the "logical" left and right buttons when used with hotkeys. In other words, if the user has swapped the buttons via system settings, {LButton} performs a logical right click, but a physical left click activates the RButton:: hotkey. Likewise for {RButton} and LButton::. To always perform a logical click, use {Click} instead.
        ; Send {LButton Down}
        ; KeyWait LButton
        ; Send {LButton Up}
        If ( A_PriorHotkey != A_ThisHotkey or  A_TimeSincePriorHotkey > DblClickTime  )
         {
                 Send {Click} 
                 Return
         }

        v_FilePath:=GetFilePath()

        SplitPath, v_FilePath,,,v_Ext

        If (v_Ext="mp4") {

                 MsgBox % "You Double clicked on a mp4 file " . v_FilePath
                 F_Node_Write("file clicked", v_FilePath)  
        }
        Else
        {
                ; 非目标文件，则促成正常的双击
                ; 网上多是用 LButton，这里改用 Click，原因：同上
                 Send {Click} ;second Click of Double
        }

        Return



F_Node_Write(event, string) {
        ; 兼容node-ahk@1.0.7, scil版本已经加上了这句
        FileEncoding, UTF-8-RAW 

        ; Dynamically Calling a Function。这样不在node-ahk的环境下 也不会出错。经过测试，目前ahk不能用 if IsFunc("Node_Write"))  来判断函数存在性并运行函数
        fn:= "Node_Write"
        %fn%(event, string)  
        
}

