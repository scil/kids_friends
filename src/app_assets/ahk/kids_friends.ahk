#SingleInstance Ignore

TargetScriptTitle := "Hello ahk_exe electron.exe"

GroupAdd, ExplorerWindows, ahk_class Progman ;Desktop
GroupAdd, ExplorerWindows, ahk_class CabinetWClass ;Explorer Window
GroupAdd, ExplorerWindows, ahk_class ExploreWClass ;Other Explorer Window

DblClickTime := DllCall("GetDoubleClickTime", "UInt")


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

$LButton::

        If ( A_PriorHotkey != A_ThisHotkey or  A_TimeSincePriorHotkey > DblClickTime  )
         {
                 Send {Click}
                 Return
         }

        v_FilePath:=GetFilePath()

        SplitPath, v_FilePath,,,v_Ext

        If (v_Ext="mp4" or v_Ext="mkv" or v_Ext="rmvb") {

                 FUNC_FILE_TO_RUN("file clicked", v_FilePath)
        }
        Else
        {
                 Send {Click} ;second Click of Double
        }

        Return


FUNC_FILE_TO_RUN(event, StringToSend) {
        global TargetScriptTitle
        WinShow, % TargetScriptTitle
        WinMaximize, % TargetScriptTitle
        WinActivate, % TargetScriptTitle
        WinSet, AlwaysOnTop, On, % TargetScriptTitle
        result := Send_WM_COPYDATA(StringToSend, TargetScriptTitle)
         return

}



Send_WM_COPYDATA(ByRef StringToSend, ByRef TargetScriptTitle)
{
    VarSetCapacity(CopyDataStruct, 3*A_PtrSize, 0)
    SizeInBytes := (StrLen(StringToSend) + 1) * (A_IsUnicode ? 2 : 1)
    NumPut(SizeInBytes, CopyDataStruct, A_PtrSize)
    NumPut(&StringToSend, CopyDataStruct, 2*A_PtrSize)
    Prev_DetectHiddenWindows := A_DetectHiddenWindows
    Prev_TitleMatchMode := A_TitleMatchMode
    DetectHiddenWindows On
    SetTitleMatchMode 2
    TimeOutTime := 4000
    SendMessage, 0x4a, 0, &CopyDataStruct,, %TargetScriptTitle%,,,, %TimeOutTime%
    DetectHiddenWindows %Prev_DetectHiddenWindows%
    SetTitleMatchMode %Prev_TitleMatchMode%
    return ErrorLevel
}
