
use strict;
use warnings;

use lib 'tests/perl_tests/lib';
use JBlibs;

use Test::More;

use File::Copy::Recursive 'dircopy';
use File::Path qw( rmtree );
use File::Temp;

use FileSlurping qw( slurp slurp_tree );

my $tempdir = new_volvox_sandbox();
my $temp2 = File::Temp->newdir( CLEANUP => $ENV{KEEP_ALL} ? 0 : 1 );
system $^X, 'bin/generate-names.pl', (
    '--out'   => "$tempdir",
    '--workdir' => $temp2,
    '--hashBits' => 16,
    '--completionLimit' => 15
    );
ok( ! $?, 'generate-names.pl also ran ok on volvox test data' );
{
    my $got = read_names($tempdir);
    my $expected = read_names('tests/data/volvox_formatted_names');
    is_deeply( $got, $expected , 'got right data from volvox test data run' )
        or diag explain read_names($tempdir);
#    diag explain $got->{'c12/9.json'}{apple2}{exact};
#    diag explain $expected->{'c12/9.json'}{apple2}{exact};
}

#system "echo TEMPDIR IS $tempdir; cat $tempdir/names/2be/0.json; echo;";

system $^X, 'bin/generate-names.pl', (
    '--out'   => "$tempdir",
    '--workdir' => $temp2,
    '--hashBits' => 16,
    '--incremental',
    '--tracks' => 'ExampleFeatures,NameTest',
    '--completionLimit' => 15
    );
ok( ! $?, 'generate-names.pl ran ok with incremental' );
{
    my $got = read_names($tempdir);
    my $expected = read_names('tests/data/volvox_formatted_names');
    is_deeply( $got, $expected, 'same data after incremental run' );# or diag explain read_names($tempdir);
}


system $^X, 'bin/generate-names.pl', (
    '--out'   => "$tempdir",
    '--workdir' => $temp2,
    '--hashBits' => 16,
    '--incremental',
    '--safeMode',
    '--tracks' => 'ExampleFeatures,NameTest',
    '--completionLimit' => 15
    );
ok( ! $?, 'generate-names.pl ran ok with incremental' );
{
    my $got = read_names($tempdir);
    my $expected = read_names('tests/data/volvox_formatted_names');
    is_deeply( $got, $expected, 'same data after incremental run with --safeMode' );# or diag explain read_names($tempdir);
}

$tempdir = new_volvox_sandbox();
system $^X, 'bin/generate-names.pl', (
    '--dir'   => "$tempdir",
    '--tracks' => 'ExampleFeatures,NameTest',
    );
ok( ! $?, 'generate-names.pl also ran ok with the --tracks option' );
cmp_ok( -s "$tempdir", '>', 1000, 'the dir has some stuff in it' );

done_testing;

sub read_names {
    my $d = slurp_tree(shift.'/names');
    delete $d->{'meta.json'}{last_changed_entry};
    return $d;
}

sub new_volvox_sandbox {
    my $tempdir = File::Temp->newdir( CLEANUP => $ENV{KEEP_ALL} ? 0 : 1 );
    dircopy( 'tests/data/volvox_formatted_names', $tempdir );
    rmtree( "$tempdir/names" );
    return $tempdir;
}
